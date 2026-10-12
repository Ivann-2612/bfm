import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getContent, site, DEFAULT_LANG } from "../content";
import { supabaseAdmin, supabaseMissing } from "./supabase";

const isDev = process.env.NODE_ENV === "development";
/** Used only on `npm run dev` when ADMIN_KEY isn't set, so the page can be opened locally. */
export const DEV_KEY = "lokalno";

// The organiser's page lives at /karte/<ADMIN_KEY>: no login, the long random key in the URL
// is the password. In production, without ADMIN_KEY the page does not exist at all.
export function isAdminKey(key: string) {
  const expected = process.env.ADMIN_KEY || (isDev ? DEV_KEY : "");
  if (!expected || (!isDev && expected.length < 16)) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Status = "pending" | "paid" | "expired" | "cancelled";
export const STATUSES: Status[] = ["pending", "paid", "expired", "cancelled"];
export const STATUS_LABEL: Record<Status, string> = {
  pending: "Čeka uplatu",
  paid: "Plaćeno",
  expired: "Isteklo",
  cancelled: "Otkazano",
};

type DbRow = {
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

/** Everything pre-formatted on the server so the client table renders identical text (no hydration drift). */
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

const c = getContent(DEFAULT_LANG);
const s = site(DEFAULT_LANG);
const packageName = (id: string) => c.packages.items.find((p) => p.id === id)?.name ?? id;
const extrasText = (extras: Record<string, number> | null) =>
  Object.entries(extras ?? {})
    .map(([id, qty]) => `${c.packages.extras.find((x) => x.id === id)?.label ?? id} × ${qty}`)
    .join(", ");
const dateFmt = new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "medium", timeStyle: "short", timeZone: c.site.timeZone });

function toTicket(r: DbRow): Ticket {
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

export async function loadTickets(): Promise<{ tickets: Ticket[]; error: string | null; demo: boolean }> {
  const db = supabaseAdmin();
  const fail = (error: string) =>
    // Locally the office proxy blocks Supabase: show sample rows so the page can still be reviewed.
    isDev ? { tickets: DEMO.map(toTicket), error, demo: true } : { tickets: [], error, demo: false };

  if (!db) {
    return fail(
      `Baza (Supabase) nije povezana. Na Vercel-u nedostaje: ${supabaseMissing().join(", ")}. Posle dodavanja uradi Redeploy.`,
    );
  }
  try {
    const { data, error } = await db
      .from("registrations")
      .select("id, created_at, lang, first_name, last_name, email, phone, country, package_id, extras, notes, price_tier, total_eur, status")
      .eq("event_year", c.event.year)
      .order("created_at", { ascending: false });
    if (error) return fail(`Greška pri čitanju baze: ${error.message}`);
    return { tickets: ((data ?? []) as DbRow[]).map(toTicket), error: null, demo: false };
  } catch (e) {
    return fail(`Baza nije dostupna: ${(e as Error).message}`);
  }
}

// Sample data for local preview only (never used in production).
const DEMO: DbRow[] = [
  { id: "d1", created_at: "2026-10-12T14:05:00Z", lang: "sr", first_name: "Marko", last_name: "Petrović", email: "marko@example.com", phone: "+381 64 111 222", country: "Srbija", package_id: "standard", extras: {}, notes: "", price_tier: "early", total_eur: 99, status: "paid" },
  { id: "d2", created_at: "2026-10-11T09:30:00Z", lang: "en", first_name: "Anna", last_name: "Novak", email: "anna@example.com", phone: null, country: "Slovenia", package_id: "dealer", extras: { table: 1 }, notes: "Need a power socket", price_tier: "early", total_eur: 199, status: "pending" },
  { id: "d3", created_at: "2026-10-03T18:12:00Z", lang: "sr", first_name: "Jelena", last_name: "Ilić", email: "jelena@example.com", phone: "+381 63 333 444", country: "Srbija", package_id: "standard", extras: {}, notes: "", price_tier: "early", total_eur: 99, status: "expired" },
  { id: "d4", created_at: "2026-10-10T11:00:00Z", lang: "en", first_name: "Luca", last_name: "Bianchi", email: "luca@example.com", phone: null, country: "Italy", package_id: "dealer", extras: { table: 1, assistant: 1 }, notes: "", price_tier: "early", total_eur: 249, status: "paid" },
];
