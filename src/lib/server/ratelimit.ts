import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "./supabase";

// Per IP: a short burst limit and a daily ceiling. Generous enough for a club or hotel
// sharing one connection, low enough that a script can't flood the inbox or the Resend quota.
const LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 5 },
  { windowMs: 24 * 60 * 60 * 1000, max: 30 },
];

// The IP is never stored: only a hash salted with a server secret and the date, so it can't
// be reversed by hashing every IPv4 address and changes every day.
function hashIp(ip: string) {
  const salt = process.env.ADMIN_KEY ?? process.env.CRON_SECRET ?? "";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${day}|${ip}`).digest("hex").slice(0, 32);
}

// Fallback when the database is off or unreachable. Serverless instances don't share memory,
// so this only stops bursts that hit the same instance, which is still most of them.
const memory = new Map<string, number[]>();

function memoryCheck(key: string, now: number) {
  const longest = Math.max(...LIMITS.map((l) => l.windowMs));
  const hits = (memory.get(key) ?? []).filter((t) => now - t < longest);
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) memory.delete(memory.keys().next().value!);
  return retryAfter(hits, now);
}

/** Seconds until the oldest attempt in the exceeded window drops out, or 0 if the request may pass. */
function retryAfter(times: number[], now: number) {
  for (const { windowMs, max } of LIMITS) {
    const inWindow = times.filter((t) => now - t < windowMs).sort((a, b) => a - b);
    if (inWindow.length > max) return Math.ceil((inWindow[inWindow.length - max - 1] + windowMs - now) / 1000);
  }
  return 0;
}

/**
 * Records this attempt and returns how many seconds the caller must wait (0 = allowed).
 * Fails open: if the check itself breaks, registrations still go through.
 */
export async function registerRateLimit(ip: string | null): Promise<number> {
  if (!ip) return 0;
  const now = Date.now();
  const key = hashIp(ip);
  const local = memoryCheck(key, now);
  if (local) return local;

  const db = supabaseAdmin();
  if (!db) return 0;
  try {
    const since = new Date(now - Math.max(...LIMITS.map((l) => l.windowMs))).toISOString();
    const { data, error } = await db
      .from("register_attempts")
      .select("created_at")
      .eq("ip_hash", key)
      .gte("created_at", since);
    if (error) throw error;
    const { error: insertError } = await db.from("register_attempts").insert({ ip_hash: key });
    if (insertError) throw insertError;
    const times = [...data.map((r) => Date.parse(r.created_at)), now];
    return retryAfter(times, now);
  } catch (e) {
    console.error("register: rate limit check failed, letting the request through", e);
    return 0;
  }
}
