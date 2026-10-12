import "server-only";
import { Resend } from "resend";
import { fill, isLang, site, DEFAULT_LANG, type Lang } from "../content";
import { computePrice, type Quote } from "../pricing";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function resend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** True when registrations can be emailed to the organiser (key, sender and recipient all set). */
export const mailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM && process.env.ORGANIZER_EMAIL);

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const client = resend();
  const from = process.env.RESEND_FROM;
  if (!client || !from) {
    console.info(`[mail:dry-run] to=${to} subject="${subject}"`);
    return;
  }
  const { error } = await client.emails.send({ from, to, subject, html, replyTo });
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
  const pay = c.registration.payment;
  const event = eventName(lang);
  const html = `
    <p>${esc(fill(m.greeting, { firstName: p.firstName }))}</p>
    <p>${esc(fill(m.intro, { event }))}</p>
    ${quoteTable(lang, quote)}
    <p><b>${esc(m.paymentTitle)}</b><br>
      ${esc(m.beneficiary)}: ${esc(pay.beneficiary)}<br>
      ${esc(m.bank)}: ${esc(pay.bankName)}<br>
      IBAN: ${esc(pay.iban)}<br>
      SWIFT: ${esc(pay.swift)}<br>
      ${esc(pay.referenceHint)}</p>
    <p>${esc(fill(m.hold, { contact: c.site.contactEmail }))}</p>`;
  // Replies go to the festival, not to the sending address.
  await send(p.email, fill(m.subject, { event }), html, c.site.contactEmail);
}

// The organiser always gets Serbian, whatever language the visitor used. Without Supabase this
// email is the only record of the registration, so it carries every field.
export async function notifyOrganizer(
  visitorLang: Lang,
  p: Person & { phone: string; country: string; notes: string; packageId: string; extras: Partial<Record<string, number>> },
  now: Date,
) {
  const to = process.env.ORGANIZER_EMAIL;
  if (!to) return;
  const s = site(DEFAULT_LANG);
  const m = s.c.emails.organizer;
  // Same amounts as the visitor's quote (enforced in content.ts), with Serbian labels.
  const quote = computePrice(p, now, DEFAULT_LANG);
  const row = (label: string, value: string) =>
    `<tr><td style="padding:3px 16px 3px 0;color:#666">${esc(label)}</td><td>${value}</td></tr>`;
  const received = new Intl.DateTimeFormat(s.c.site.locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: s.c.site.timeZone,
  }).format(now);
  const html = `
    <p style="font-size:18px"><b>${esc(p.firstName)} ${esc(p.lastName)}</b></p>
    <table style="border-collapse:collapse;margin-bottom:16px">
      ${row(m.email, `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`)}
      ${p.phone ? row(m.phone, esc(p.phone)) : ""}
      ${row(m.country, esc(p.country))}
      ${row(m.language, visitorLang.toUpperCase())}
      ${row(m.received, esc(received))}
    </table>
    ${quoteTable(DEFAULT_LANG, quote)}
    ${p.notes ? `<p><b>${esc(m.notes)}:</b> ${esc(p.notes)}</p>` : ""}
    <p style="color:#666;font-size:13px">${esc(m.replyHint)}</p>`;
  await send(to, fill(m.subject, { firstName: p.firstName, lastName: p.lastName, total: s.money(quote.total) }), html, p.email);
}

export async function sendExpiryNotice(row: { first_name: string; email: string; lang: string }) {
  const lang = isLang(row.lang) ? row.lang : DEFAULT_LANG;
  const s = site(lang);
  const m = s.c.emails.expiry;
  const event = eventName(lang);
  const html = `
    <p>${esc(fill(m.greeting, { firstName: row.first_name }))}</p>
    <p>${esc(fill(m.released, { event }))}</p>
    <p>${esc(fill(m.again, { date: s.formatInstant(s.c.packages.earlyBirdUntil) }))}</p>`;
  await send(row.email, fill(m.subject, { event }), html, s.c.site.contactEmail);
}
