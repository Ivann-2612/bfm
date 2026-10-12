import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, fill, getContent, isLang } from "@/lib/content";
import { computePrice } from "@/lib/pricing";
import { fieldErrors, registrationSchema } from "@/lib/schema";
import { supabaseAdmin } from "@/lib/server/supabase";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { notifyOrganizer, sendConfirmation } from "@/lib/server/mail";

const isProd = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // Pick the language first so validation messages come back in it.
  const lang = isLang(body?.lang) ? body.lang : DEFAULT_LANG;
  const c = getContent(lang);
  const errors = c.registration.errors;

  const parsed = registrationSchema(lang).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ message: errors.spam }, { status: 400 });
  }

  // The only price that counts. Whatever the browser showed is ignored.
  const now = new Date();
  const quote = computePrice(data, now, lang);

  const db = supabaseAdmin();
  if (!db) {
    if (isProd) {
      console.error("register: SUPABASE_URL / SUPABASE_SECRET_KEY not set");
      return NextResponse.json({ message: errors.unavailable }, { status: 503 });
    }
    console.info("[register:dry-run]", { ...data, turnstileToken: undefined, quote });
    return NextResponse.json({ ok: true, dryRun: true, total: quote.total }, { status: 201 });
  }

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

  // The registration is saved; a mail failure must not turn it into an error for the user.
  const mails = await Promise.allSettled([sendConfirmation(lang, data, quote), notifyOrganizer(data, quote)]);
  for (const m of mails) if (m.status === "rejected") console.error("register: mail failed", m.reason);

  return NextResponse.json({ ok: true, id: row.id, total: quote.total }, { status: 201 });
}
