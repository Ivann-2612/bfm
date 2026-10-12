import "server-only";
import { Resend } from "resend";
import { fill, isLang, site, DEFAULT_LANG, type Lang } from "../content";
import type { Quote } from "../pricing";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function resend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, html: string) {
  const client = resend();
  const from = process.env.RESEND_FROM;
  if (!client || !from) {
    console.info(`[mail:dry-run] to=${to} subject="${subject}"`);
    return;
  }
  const { error } = await client.emails.send({ from, to, subject, html });
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
    <p>${esc(m.hold)}</p>`;
  await send(p.email, fill(m.subject, { event }), html);
}

// The organiser always gets Serbian, whatever language the visitor used.
export async function notifyOrganizer(p: Person & { country: string; notes: string }, quote: Quote) {
  const to = process.env.ORGANIZER_EMAIL;
  if (!to) return;
  const s = site(DEFAULT_LANG);
  const m = s.c.emails.organizer;
  const html = `
    <p><b>${esc(p.firstName)} ${esc(p.lastName)}</b> (${esc(p.email)}, ${esc(p.country)})</p>
    ${quoteTable(DEFAULT_LANG, quote)}
    ${p.notes ? `<p>${esc(m.notes)}: ${esc(p.notes)}</p>` : ""}`;
  await send(to, fill(m.subject, { firstName: p.firstName, lastName: p.lastName, total: s.money(quote.total) }), html);
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
  await send(row.email, fill(m.subject, { event }), html);
}
