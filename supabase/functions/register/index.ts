import { createClient } from "npm:@supabase/supabase-js@2";
import { DEFAULT_LANG, getContent, isLang } from "../_shared/content.ts";
import { computePrice } from "../_shared/pricing.ts";
import { fieldErrors, registrationSchema } from "../_shared/schema.ts";
import { notifyOrganizer, sendConfirmation } from "../_shared/mail.ts";
import { allowedOrigin, clientIp, json } from "../_shared/http.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function rateLimit(ip: string | null) {
  if (!ip) return 0;
  // Keep the production implementation aligned with the project rate-limit logic.
  // Full details live in src/lib/server/ratelimit.ts; this scaffold keeps the route contract valid.
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  if (req.method !== "POST")
    return json(req, { message: "Method not allowed" }, 405);

  const raw = await req.text();
  if (raw.length > 16_000)
    return json(req, { message: "Payload too large" }, 413);

  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }

  const lang = isLang(body?.lang) ? body!.lang : DEFAULT_LANG;
  const c = getContent(lang);
  const errors = c.registration.errors;

  if (!allowedOrigin(req)) return json(req, { message: errors.spam }, 403);

  const wait = await rateLimit(clientIp(req));
  if (wait > 0) {
    return json(req, { message: errors.tooMany }, 429, {
      "Retry-After": String(wait),
    });
  }

  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return json(req, { message: errors.spam }, 400);
  }

  const parsed = registrationSchema(lang).safeParse(body);
  if (!parsed.success) {
    return json(req, { errors: fieldErrors(parsed.error) }, 400);
  }

  const data = parsed.data;
  const quote = computePrice(data, new Date(), lang);

  const { data: inserted, error } = await db
    .from("registrations")
    .insert({
      ...data,
      total: quote.total,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return json(req, { message: c.registration.errors.duplicate }, 409);
    console.error("register.insert", error);
    return json(req, { message: c.registration.errors.server }, 500);
  }

  await Promise.allSettled([
    notifyOrganizer(lang, inserted, new Date()),
    sendConfirmation(lang, inserted, quote),
  ]);

  return json(req, { ok: true, id: inserted.id, total: quote.total }, 201);
});
