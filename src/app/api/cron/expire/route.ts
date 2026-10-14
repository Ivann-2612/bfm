import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase";
import { sendExpiryNotice } from "@/lib/server/mail";

const HOLD_DAYS = 7;

// Called daily by Vercel Cron (see vercel.json).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ message: "Supabase not configured" }, { status: 503 });

  const cutoff = new Date(Date.now() - HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from("registrations")
    .update({ status: "expired", expired_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id, first_name, email, lang");

  if (error) {
    console.error("cron/expire: update failed", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Rate-limit records (hashed IPs) are only needed for a day; the privacy policy promises two at most.
  const { error: cleanupError } = await db
    .from("register_attempts")
    .delete()
    .lt("created_at", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  if (cleanupError) console.error("cron/expire: register_attempts cleanup failed", cleanupError.message);

  const results = await Promise.allSettled(data.map((r) => sendExpiryNotice(r)));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.error(`cron/expire: ${failed} reminder(s) failed`);

  // One line per run, so Vercel → Logs shows that the job ran (and the database was reached).
  console.info(`cron/expire: ok, database reached, ${data.length} registration(s) expired`);
  return NextResponse.json({ expired: data.length, remindersFailed: failed });
}
