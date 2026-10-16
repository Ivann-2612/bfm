import { Resend } from "npm:resend@6";
import { fill, site, ORGANIZER_LANG, type Lang } from "../_shared/content.ts";
import { computePrice, type Quote } from "../_shared/pricing.ts";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const env = (k: string) => Deno.env.get(k) ?? "";

export const mailConfigured = () => Boolean(env("RESEND_API_KEY") && env("RESEND_FROM") && env("ORGANIZER_EMAIL"));

async function send(to: string | string[], subject: string, html: string, replyTo?: string) {
  const key = env("RESEND_API_KEY");
  const from = env("RESEND_FROM");
  if (!key || !from) {
    console.info(`[mail:dry-run] to=${to} subject="${subject}"`);
    return;
  }
  const { error } = await new Resend(key).emails.send({ from, to, subject, html, replyTo });
  if (error) throw new Error(`Resend: ${error.message}`);
}

type Person = { firstName: string; lastName: string; email: string };

function quoteTable(lang: Lang, quote: Quote) {
  const s = site(lang);
  const rows = quote.lines
    .map((l) => `<tr><td style="padding:4px 16px 4px 0">${esc(l.label)}</td><td align="right">${s.money(l.amount)}</td></tr>`)
    .join("");
  return `<table style="border-collapse:collapse">${rows}<tr><td style="padding-top:8px"><b>${esc(s.c.emails.total)}</b></td><td align="right" style="padding-top:8px"><b>${s.money(quote.total)}</b></td></tr></table>`;
}

const eventName = (lang: Lang) => {
  const { name, year } = site(lang).c.event;
  return `${name} ${year}`;
};

export async function sendConfirmation(lang: Lang, p: Person, quote: Quote) {
  const { c } = site(lang);
  const m = c.emails.confirmation;
  const { payment, labels: L } = c.registration;
  const event = eventName(lang);
  const reference = `${p.firstName} ${p.lastName}`;
  const methods = payment.methods
    .map((method) => {
      const rows = [...method.fields.map((f) => [f.label, f.copy]), [L.amount, site(lang).money(quote.total)], [L.reference, reference]]
        .map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
        .join("");
      return `<p style="margin:16px 0 4px"><b>${esc(method.label)}</b></p>
        <table style="border-collapse:collapse">${rows}</table>
        ${method.note ? `<p style="color:#666;font-size:13px;margin:4px 0 0">${esc(method.note)}</p>` : ""}`;
    })
    .join("");
  const html = `
    <p>${esc(fill(m.greeting, { firstName: p.firstName }))}</p>
    <p>${esc(fill(m.intro, { event }))}</p>
    ${quoteTable(lang, quote)}
    <h3 style="margin:24px 0 0">${esc(m.paymentTitle)}</h3>
    ${methods}
    <p>${esc(payment.referenceHint)}</p>
    <p>${esc(fill(m.hold, { contact: c.site.contactEmail }))}</p>`;
  await send(p.email, fill(m.subject, { event }), html, c.site.contactEmail);
}

export async function notifyOrganizer(
  visitorLang: Lang,
  p: Person & { phone: string; country: string; notes: string; packageId: string; extras: Partial<Record<string, number>> },
  now: Date,
) {
  const to = env("ORGANIZER_EMAIL")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  if (to.length === 0) return;
  const s = site(ORGANIZER_LANG);
  const m = s.c.emails.organizer;
  const quote = computePrice(p, now, ORGANIZER_LANG);
  const row = (label: string, value: string) => `<tr><td style="padding:3px 16px 3px 0;color:#666">${esc(label)}</td><td>${value}</td></tr>`;
  const received = new Intl.DateTimeFormat(s.c.site.locale, { dateStyle: "long", timeStyle: "short", timeZone: s.c.site.timeZone }).format(now);
  const html = `
    <p style="font-size:18px"><b>${esc(p.firstName)} ${esc(p.lastName)}</b></p>
    <table style="border-collapse:collapse;margin-bottom:16px">
      ${row(m.email, `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`)}
      ${p.phone ? row(m.phone, esc(p.phone)) : ""}
      ${row(m.country, esc(p.country))}
      ${row(m.language, visitorLang.toUpperCase())}
      ${row(m.received, esc(received))}
    </table>
    ${quoteTable(ORGANIZER_LANG, quote)}
    ${p.notes ? `<p><b>${esc(m.notes)}:</b> ${esc(p.notes)}</p>` : ""}
    <p style="color:#666;font-size:13px">${esc(m.replyHint)}</p>`;
  await send(to, fill(m.subject, { firstName: p.firstName, lastName: p.lastName, total: s.money(quote.total) }), html, p.email);
}
