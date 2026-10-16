import { getContent, ORGANIZER_LANG } from "../_shared/content.ts";
import { STATUSES, TICKET_COLUMNS, ticketsCsv, toTicket, type DbRow, type Status } from "../_shared/tickets.ts";
import { db } from "../_lib/db.ts";
import { cors, json, safeEqual } from "../_lib/http.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const year = getContent(ORGANIZER_LANG).event.year;

async function isAdmin(req: Request) {
  const expected = Deno.env.get("ADMIN_KEY") ?? "";
  const given = req.headers.get("x-admin-key") ?? "";
  return expected.length >= 16 && (await safeEqual(given, expected));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  const url = new URL(req.url);

  if (req.method === "GET" && url.searchParams.has("ping")) {
    const { error } = await db.from("registrations").select("id", { head: true, count: "exact" }).limit(1);
    return new Response(error ? "db error" : "ok", { status: error ? 500 : 200 });
  }

  if (!(await isAdmin(req))) return new Response("Not found", { status: 404, headers: cors(req) });

  if (req.method === "POST") {
    const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    const status = body?.status as Status;
    if (!UUID.test(id) || !STATUSES.includes(status)) return json(req, { message: "Neispravan zahtev." }, 400);
    const { data, error } = await db.from("registrations").update({ status }).eq("id", id).select("id, status").maybeSingle();
    if (error) return json(req, { message: `Greška baze: ${error.message}` }, 500);
    if (!data) return json(req, { message: "Prijava više ne postoji." }, 404);
    return json(req, { ok: true, status: data.status });
  }

  if (req.method !== "GET") return json(req, { message: "Method not allowed" }, 405);

  const { data, error } = await db
    .from("registrations")
    .select(TICKET_COLUMNS)
    .eq("event_year", year)
    .order("created_at", { ascending: false });
  if (error) return json(req, { message: `Greška pri čitanju baze: ${error.message}` }, 500);
  const tickets = ((data ?? []) as DbRow[]).map(toTicket);

  if (url.searchParams.get("format") === "csv") {
    return new Response(ticketsCsv(tickets), {
      headers: {
        ...cors(req),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="karte-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return json(req, { tickets }, 200, { "Cache-Control": "no-store" });
});
