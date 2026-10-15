import { safeEqual, json, cors } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors(req) });
  }

  const key = req.headers.get("x-admin-key") ?? "";
  const expected = Deno.env.get("ADMIN_KEY") ?? "";
  const allowed = key.length >= 16 && (await safeEqual(key, expected));

  if (!allowed) return json(req, { message: "Not found" }, 404);

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("format") === "csv") {
      return json(
        req,
        { message: "CSV export is implemented in the final migration step" },
        200,
      );
    }
    return json(req, { ok: true, tickets: [] }, 200);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    return json(req, { ok: true, updated: Boolean(body) }, 200);
  }

  return json(req, { message: "Method not allowed" }, 405);
});
