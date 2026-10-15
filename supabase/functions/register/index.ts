// POST /functions/v1/register — the registration form. Replaces the Next route /api/register.
// Order of checks: size → origin → rate limit (429) → honeypot → schema → Turnstile →
// price (computed here only) → insert → emails.
import { DEFAULT_LANG, fill, getContent, isLang } from "../_shared/content.ts";
import { computePrice } from "../_shared/pricing.ts";
import { fieldErrors, registrationSchema } from "../_shared/schema.ts";
import { db } from "../_lib/db.ts";
import { allowedOrigin, clientIp, cors, json } from "../_lib/http.ts";
import { notifyOrganizer, sendConfirmation } from "../_lib/mail.ts";
import { rateLimit } from "../_lib/ratelimit.ts";
import { verifyTurnstile } from "../_lib/turnstile.ts";

const MAX_BODY = 16_000; // a real registration is about 1–2 KB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { message: "Method not allowed" }, 405);

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY) return json(req, { message: "Payload too large" }, 413);
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // invalid JSON: the schema below reports the missing fields
  }
  // Pick the language first so validation messages come back in it.
  const asked = body?.lang;
  const lang = isLang(asked) ? asked : DEFAULT_LANG;
  const c = getContent(lang);
  const errors = c.registration.errors;

  if (!allowedOrigin(req)) return json(req, { message: errors.spam }, 403);

  const ip = clientIp(req);
  const wait = await rateLimit(ip);
  if (wait) {
    return json(req, { message: fill(errors.tooMany, { minutes: Math.max(1, Math.ceil(wait / 60)) }) }, 429, {
      "Retry-After": String(wait),
    });
  }

  // Honeypot: a field people never see. Bots that fill every input end up here.
  if (typeof body?.website === "string" && body.website.trim() !== "") return json(req, { message: errors.spam }, 400);

  const parsed = registrationSchema(lang).safeParse(body);
  if (!parsed.success) return json(req, { errors: fieldErrors(parsed.error) }, 400);
  const data = parsed.data;

  if (!(await verifyTurnstile(data.turnstileToken, ip))) return json(req, { message: errors.spam }, 400);

  // The only price that counts. Whatever the browser showed is ignored.
  const now = new Date();
  const quote = computePrice(data, now, lang);

  const { data: row, error } = await db
    .from("registrations")
    .insert({
      event_year: c.event.year,
      lang,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      country: data.country,
      package_id: data.packageId,
      extras: quote.extras,
      notes: data.notes || null,
      price_tier: quote.tier,
      price_lines: quote.lines,
      total_eur: quote.total,
      consent_text: c.registration.consentText,
      consent_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return json(req, { errors: { email: fill(errors.duplicate, { year: c.event.year, contact: c.site.contactEmail }) } }, 409);
    }
    console.error(`register: insert failed [${error.code}] ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
    return json(req, { message: errors.saveFailed }, 500);
  }

  // The registration is saved; a failed email is logged but doesn't fail the request.
  const [organizer, confirmation] = await Promise.allSettled([notifyOrganizer(lang, data, now), sendConfirmation(lang, data, quote)]);
  if (organizer.status === "rejected") console.error("register: organizer mail failed", organizer.reason);
  if (confirmation.status === "rejected") console.error("register: confirmation mail failed", confirmation.reason);

  return json(req, { ok: true, id: row.id, total: quote.total }, 201);
});
