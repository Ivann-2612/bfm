// Registrations as the organiser sees them on /karte. Shared by the page (browser) and the
// Supabase function `tickets` (scripts/sync-functions.mjs copies this file), so both format
// dates, packages and amounts the same way.
import { getContent, site, ORGANIZER_LANG } from "./content";

export type Status = "pending" | "paid" | "expired" | "cancelled";
export const STATUSES: Status[] = ["pending", "paid", "expired", "cancelled"];
export const STATUS_LABEL: Record<Status, string> = {
  pending: "Čeka uplatu",
  paid: "Plaćeno",
  expired: "Isteklo",
  cancelled: "Otkazano",
};

/** Columns read from the `registrations` table. */
export const TICKET_COLUMNS =
  "id, created_at, lang, first_name, last_name, email, phone, country, package_id, extras, notes, price_tier, total_eur, status";

export type DbRow = {
  id: string;
  created_at: string;
  lang: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string;
  package_id: string;
  extras: Record<string, number> | null;
  notes: string | null;
  price_tier: "early" | "regular";
  total_eur: number;
  status: Status;
};

/** Everything pre-formatted, so the table and the CSV show identical text. */
export type Ticket = {
  id: string;
  ts: number;
  received: string;
  name: string;
  lang: string;
  email: string;
  phone: string;
  country: string;
  packageName: string;
  early: boolean;
  extras: string;
  total: number;
  totalText: string;
  status: Status;
  notes: string;
};

const c = getContent(ORGANIZER_LANG);
const s = site(ORGANIZER_LANG);
const packageName = (id: string) => c.packages.items.find((p) => p.id === id)?.name ?? id;
const extrasText = (extras: Record<string, number> | null) =>
  Object.entries(extras ?? {})
    .map(([id, qty]) => `${c.packages.extras.find((x) => x.id === id)?.label ?? id} × ${qty}`)
    .join(", ");
const dateFmt = new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "medium", timeStyle: "short", timeZone: c.site.timeZone });

export function toTicket(r: DbRow): Ticket {
  return {
    id: r.id,
    ts: new Date(r.created_at).getTime(),
    received: dateFmt.format(new Date(r.created_at)),
    name: `${r.first_name} ${r.last_name}`,
    lang: r.lang,
    email: r.email,
    phone: r.phone ?? "",
    country: r.country,
    packageName: packageName(r.package_id),
    early: r.price_tier === "early",
    extras: extrasText(r.extras),
    total: r.total_eur,
    totalText: s.money(r.total_eur),
    status: r.status,
    notes: r.notes ?? "",
  };
}

// Semicolon-separated with a UTF-8 BOM: opens correctly (with č/ć/ž) in Excel set to Serbian.
const cell = (v: unknown) => {
  const str = String(v ?? "");
  return /[;"\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
export function ticketsCsv(tickets: Ticket[]) {
  const header = ["Primljeno", "Ime i prezime", "Email", "Telefon", "Država", "Jezik", "Paket", "Dodaci", "Cena", "Iznos EUR", "Status", "Napomena"];
  const lines = tickets.map((t) =>
    [t.received, t.name, t.email, t.phone, t.country, t.lang, t.packageName, t.extras, t.early ? "rana prijava" : "redovna", t.total, STATUS_LABEL[t.status], t.notes]
      .map(cell)
      .join(";"),
  );
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}

/** Sample rows for `npm run dev` with the key "lokalno" (the office network can't reach Supabase). */
export const DEMO_ROWS: DbRow[] = [
  { id: "d1", created_at: "2026-10-12T14:05:00Z", lang: "sr", first_name: "Marko", last_name: "Petrović", email: "marko@example.com", phone: "+381 64 111 222", country: "Srbija", package_id: "standard", extras: {}, notes: "", price_tier: "early", total_eur: 99, status: "paid" },
  { id: "d2", created_at: "2026-10-11T09:30:00Z", lang: "en", first_name: "Anna", last_name: "Novak", email: "anna@example.com", phone: null, country: "Slovenia", package_id: "dealer", extras: { table: 1 }, notes: "Need a power socket", price_tier: "early", total_eur: 199, status: "pending" },
  { id: "d3", created_at: "2026-10-03T18:12:00Z", lang: "sr", first_name: "Jelena", last_name: "Ilić", email: "jelena@example.com", phone: "+381 63 333 444", country: "Srbija", package_id: "standard", extras: {}, notes: "", price_tier: "early", total_eur: 99, status: "expired" },
  { id: "d4", created_at: "2026-10-10T11:00:00Z", lang: "en", first_name: "Luca", last_name: "Bianchi", email: "luca@example.com", phone: null, country: "Italy", package_id: "dealer", extras: { table: 1, assistant: 1 }, notes: "", price_tier: "early", total_eur: 249, status: "paid" },
];
