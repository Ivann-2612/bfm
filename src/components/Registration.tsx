"use client";

import { useEffect, useRef, useState } from "react";
import { fill, getContent, site, type Lang } from "@/lib/content";
import { computePrice } from "@/lib/pricing";
import { fieldErrors, registrationSchema } from "@/lib/schema";
import { SectionHead, type LangProps } from "./ui";
import { Turnstile } from "./Turnstile";
import { PaymentDetails } from "./PaymentDetails";
import { browserRegion, countryFromCode, countryNames } from "@/lib/countries";
import { CountryCombo } from "./CountryCombo";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  packageId: string;
  extras: Record<string, number>;
  notes: string;
  consent: boolean;
};

const initial = (lang: Lang): Form => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  packageId: getContent(lang).packages.items[0].id,
  extras: {},
  notes: "",
  consent: false,
});

type Status =
  | { kind: "idle" | "sending" }
  | { kind: "done"; total: number; email: string; name: string }
  | { kind: "error"; message: string };

export function Registration({ lang }: LangProps) {
  const s = site(lang);
  const { money, formatInstant } = s;
  const r = s.c.registration;
  const L = r.labels;
  const p = s.c.packages;
  const [form, setForm] = useState<Form>(() => initial(lang));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  // Early bird depends on today's date, so it is decided only in the browser after mount.
  const [now, setNow] = useState<Date | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const stubRef = useRef<HTMLElement>(null);
  // Phones: the price summary sits below the long form, so a slim bar keeps the total in view
  // while the form is on screen and the summary itself is not.
  const [formInView, setFormInView] = useState(false);
  const [stubInView, setStubInView] = useState(false);
  useEffect(() => {
    const form = formRef.current;
    const stub = stubRef.current;
    if (!form || !stub) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === form) setFormInView(e.isIntersecting);
        if (e.target === stub) setStubInView(e.isIntersecting);
      }
    });
    io.observe(form);
    io.observe(stub);
    return () => io.disconnect();
  }, [status.kind]);
  const honeypot = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => setNow(new Date()), []);
  // Suggestions for the country field, filled in the browser (see countries.ts for why).
  const [countries, setCountries] = useState<string[]>([]);
  useEffect(
    () => setCountries(countryNames(s.c.site.locale)),
    [s.c.site.locale],
  );

  // Pre-fill the country from the browser's language region ("sr-RS" → Srbija), only while the
  // field is still empty, so it never overwrites what the visitor typed.
  useEffect(() => {
    const name = countryFromCode(browserRegion(), s.c.site.locale);
    if (name) setForm((f) => (f.country ? f : { ...f, country: name }));
  }, [s.c.site.locale]);

  // The long form is swapped for a short message, so the page shrinks and leaves the visitor
  // scrolled past it (very visible on phones). Bring the message into view and focus it.
  useEffect(() => {
    if (status.kind !== "done" || !doneRef.current) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    doneRef.current.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    doneRef.current.focus({ preventScroll: true });
  }, [status.kind]);

  const quote = now ? computePrice(form, now, lang) : null;
  const chosen = p.items.find((it) => it.id === form.packageId);
  const allowedExtras = p.extras.filter((x) =>
    (chosen?.allowExtras as string[] | undefined)?.includes(x.id),
  );

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const extras = Object.fromEntries(
      allowedExtras.map((x) => [x.id, form.extras[x.id] ?? 0]),
    );
    const payload = {
      ...form,
      extras,
      lang,
      website: honeypot.current?.value ?? "",
      turnstileToken: token || undefined,
    };
    const check = registrationSchema(lang).safeParse(payload);
    if (!check.success) {
      const errs = fieldErrors(check.error);
      setErrors(errs);
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)
        ?.focus();
      return;
    }

    const functionsUrl = (
      process.env.NEXT_PUBLIC_FUNCTIONS_URL ??
      "https://pnpylpzcgoulsivplhip.supabase.co/functions/v1"
    ).replace(/\/+$/, "");
    const registerUrl = `${functionsUrl}/register`;

    setStatus({ kind: "sending" });
    try {
      const res = await fetch(registerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({
          kind: "done",
          total: data.total,
          email: check.data.email,
          name: `${check.data.firstName} ${check.data.lastName}`,
        });
        return;
      }
      if (data.errors) setErrors(data.errors);
      setStatus({ kind: "error", message: data.message ?? L.errorFields });
    } catch {
      setStatus({ kind: "error", message: L.errorNetwork });
    }
    setToken("");
    setResetKey((k) => k + 1);
  }

  const err = (k: string) =>
    errors[k] ? (
      <span className="field__error" id={`${k}-error`}>
        {errors[k]}
      </span>
    ) : null;
  const aria = (k: string) => ({
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  return (
    <section
      id="prijava"
      className="section register"
      aria-labelledby="register-title"
    >
      <span className="register__ghost" aria-hidden="true">
        ♦
      </span>
      <div className="wrap">
        <SectionHead id="register-title" kicker={r.kicker} title={r.title} />

        {status.kind === "done" ? (
          <div
            ref={doneRef}
            className="register__done"
            role="status"
            tabIndex={-1}
          >
            <span className="done__badge" aria-hidden="true">
              ✓
            </span>
            <h3>{L.doneTitle}</h3>
            <p className="done__lead">{L.doneLead}</p>
            <p>
              {fill(L.doneText, {
                email: status.email,
                total: money(status.total),
              })}
            </p>
            <ol className="done__steps">
              {L.doneSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p>{fill(L.doneHold, { contact: s.c.site.contactEmail })}</p>
            <PaymentDetails
              lang={lang}
              amount={status.total}
              amountDisplay={money(status.total)}
              reference={status.name}
            />
          </div>
        ) : (
          <div className="register__grid">
            <form ref={formRef} className="form" onSubmit={submit} noValidate>
              <p className="form__intro">{r.text}</p>

              <div className="form__row">
                <label className="field">
                  <span>{L.firstName}</span>
                  <input
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    {...aria("firstName")}
                  />
                  {err("firstName")}
                </label>
                <label className="field">
                  <span>{L.lastName}</span>
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    required
                    maxLength={80}
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    {...aria("lastName")}
                  />
                  {err("lastName")}
                </label>
              </div>

              <div className="form__row">
                <label className="field">
                  <span>{L.email}</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={200}
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    {...aria("email")}
                  />
                  {err("email")}
                </label>
                <label className="field">
                  <span>
                    {L.phone} <small>{L.optional}</small>
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={40}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span>
                  {L.country} <small>{L.countryHint}</small>
                </span>
                <CountryCombo
                  name="country"
                  required
                  maxLength={80}
                  value={form.country}
                  onChange={(v) => set("country", v)}
                  options={countries}
                  noMatch={L.countryNoMatch}
                  {...aria("country")}
                />
                {err("country")}
              </label>

              <fieldset className="field choices">
                <legend>{L.package}</legend>
                {p.items.map((it) => (
                  <label key={it.id} className="choice">
                    <input
                      type="radio"
                      name="packageId"
                      value={it.id}
                      checked={form.packageId === it.id}
                      onChange={() => set("packageId", it.id)}
                    />
                    <span className="choice__label">
                      <b>{it.name}</b>
                      <small>{it.summary}</small>
                    </span>
                  </label>
                ))}
                {err("packageId")}
              </fieldset>

              {allowedExtras.length > 0 && (
                <fieldset className="field extras">
                  <legend>{L.extras}</legend>
                  <div className="form__row">
                    {allowedExtras.map((x) => (
                      <label key={x.id} className="field">
                        <span>
                          {x.label} <small>{money(x.price)}</small>
                        </span>
                        <select
                          name={`extras.${x.id}`}
                          value={form.extras[x.id] ?? 0}
                          onChange={(e) =>
                            set("extras", {
                              ...form.extras,
                              [x.id]: Number(e.target.value),
                            })
                          }
                        >
                          {Array.from({ length: x.max + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n === 0 ? L.none : n}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <label className="field">
                <span>
                  {L.notes}{" "}
                  <small>
                    {L.optional} — {L.notesHint}
                  </small>
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  {...aria("notes")}
                />
                {err("notes")}
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  name="consent"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  {...aria("consent")}
                />
                <span>{r.consentText}</span>
              </label>
              {err("consent")}

              {/* Honeypot: hidden from people and screen readers; bots that fill every field get rejected. */}
              <div className="hp" aria-hidden="true">
                <label>
                  Website
                  <input
                    ref={honeypot}
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </label>
              </div>

              <Turnstile onToken={setToken} resetKey={resetKey} />

              {status.kind === "error" && (
                <p className="form__error" role="alert">
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                className="btn btn--wide"
                disabled={status.kind === "sending"}
              >
                {status.kind === "sending" ? L.sending : L.submit}
              </button>
            </form>

            <aside
              ref={stubRef}
              className="stub"
              aria-label={L.summary}
              aria-live="polite"
            >
              <p className="kicker">{L.summary}</p>
              {quote ? (
                <>
                  <ul className="stub__lines">
                    {quote.lines.map((l) => (
                      <li key={l.label}>
                        <span>{l.label}</span>
                        <span>{money(l.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="stub__total">
                    <span>{L.total}</span>
                    <b>{money(quote.total)}</b>
                  </p>
                  <p className="stub__note">
                    {quote.tier === "early"
                      ? fill(L.earlyNote, {
                          date: formatInstant(p.earlyBirdUntil),
                        })
                      : L.regularNote}{" "}
                    {L.paymentNote}
                  </p>
                </>
              ) : (
                <p className="stub__note">{L.calculating}</p>
              )}
            </aside>
            {quote && formInView && !stubInView && (
              <div className="total-bar" aria-hidden="true">
                <span className="total-bar__text">
                  <small>
                    {p.items.find((it) => it.id === form.packageId)?.name}
                  </small>
                  <span>
                    {L.total} <b>{money(quote.total)}</b>
                  </span>
                </span>
                <button
                  type="button"
                  className="total-bar__link"
                  tabIndex={-1}
                  onClick={() =>
                    stubRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                  }
                >
                  {L.summaryLink} ↓
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
