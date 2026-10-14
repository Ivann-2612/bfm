import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, fill, getContent, isLang } from "@/lib/content";
import { computePrice } from "@/lib/pricing";
import { fieldErrors, registrationSchema } from "@/lib/schema";
import { supabaseAdmin } from "@/lib/server/supabase";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { registerRateLimit } from "@/lib/server/ratelimit";
import { mailConfigured, notifyOrganizer, sendConfirmation } from "@/lib/server/mail";

const isProd = process.env.NODE_ENV === "production";
const MAX_BODY = 16_000;

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// A registration is kept in Supabase when it is configured, and is always emailed to the
// organiser when Resend is configured. With neither, it would vanish, so the request fails.
export async function POST(req: NextRequest) {
  // A real registration is about 1–2 KB; anything far bigger isn't from the form.
  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY) return NextResponse.json({ message: "Payload too large" }, { status: 413 });
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  // Pick the language first so validation messages come back in it.
  const lang = isLang(body?.lang) ? body.lang : DEFAULT_LANG;
  const c = getContent(lang);
  const errors = c.registration.errors;

  // Browsers always send Origin with fetch POSTs; scripts posting from elsewhere usually don't.
  if (!sameOrigin(req)) return NextResponse.json({ message: errors.spam }, { status: 403 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const wait = await registerRateLimit(ip);
  if (wait) {
    return NextResponse.json(
      { message: fill(errors.tooMany, { minutes: Math.max(1, Math.ceil(wait / 60)) }) },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  // Honeypot: a field people never see. Bots that fill every input end up here.
  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ message: errors.spam }, { status: 400 });
  }

  const parsed = registrationSchema(lang).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ message: errors.spam }, { status: 400 });
  }

  // The only price that counts. Whatever the browser showed is ignored.
  const now = new Date();
  const quote = computePrice(data, now, lang);

  const db = supabaseAdmin();
  const canMail = mailConfigured();
  if (!db && !canMail) {
    if (isProd) {
      console.error("register: neither Supabase nor Resend is configured");
      return NextResponse.json({ message: errors.unavailable }, { status: 503 });
    }
    console.info("[register:dry-run]", { ...data, turnstileToken: undefined, quote });
    return NextResponse.json({ ok: true, dryRun: true, total: quote.total }, { status: 201 });
  }

  let id: string | null = null;
  if (db) {
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
        return NextResponse.json(
          { errors: { email: fill(errors.duplicate, { year: c.event.year, contact: c.site.contactEmail }) } },
          { status: 409 },
        );
      }
      console.error(`register: insert failed [${error.code}] ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
      return NextResponse.json({ message: errors.saveFailed }, { status: 500 });
    }
    id = row.id;
  }

  const [organizer, confirmation] = await Promise.allSettled([
    notifyOrganizer(lang, data, now),
    sendConfirmation(lang, data, quote),
  ]);
  if (confirmation.status === "rejected") console.error("register: confirmation mail failed", confirmation.reason);
  if (organizer.status === "rejected") {
    console.error("register: organizer mail failed", organizer.reason);
    // Without a database the organiser's email is the only record: losing it means losing the registration.
    if (!db) return NextResponse.json({ message: errors.saveFailed }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, total: quote.total }, { status: 201 });
}
