// Per IP: a short burst limit and a daily ceiling. Generous enough for a club or hotel sharing
// one connection, low enough that a script can't flood the inbox or the Resend quota.
// Same rules as the old Next route (src/lib/server/ratelimit.ts before the move to AdriaHost).
import { db } from "./db.ts";
import { sha256 } from "./http.ts";

const LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 5 },
  { windowMs: 24 * 60 * 60 * 1000, max: 30 },
];
const KEEP_MS = 2 * 24 * 60 * 60 * 1000; // the privacy policy promises two days at most

// The IP is never stored: only a hash salted with a server secret and the date, so it can't be
// reversed by hashing every IPv4 address, and it changes every day.
const hashIp = (ip: string) => sha256(`${Deno.env.get("ADMIN_KEY") ?? ""}|${new Date().toISOString().slice(0, 10)}|${ip}`).then((h) => h.slice(0, 32));

function retryAfter(times: number[], now: number) {
  for (const { windowMs, max } of LIMITS) {
    const inWindow = times.filter((t) => now - t < windowMs).sort((a, b) => a - b);
    if (inWindow.length > max) return Math.ceil((inWindow[inWindow.length - max - 1] + windowMs - now) / 1000);
  }
  return 0;
}

/** Records this attempt and returns seconds to wait (0 = allowed). Fails open if the check breaks. */
export async function rateLimit(ip: string | null): Promise<number> {
  if (!ip) return 0;
  const now = Date.now();
  try {
    const key = await hashIp(ip);
    const since = new Date(now - Math.max(...LIMITS.map((l) => l.windowMs))).toISOString();
    const { data, error } = await db.from("register_attempts").select("created_at").eq("ip_hash", key).gte("created_at", since);
    if (error) throw error;
    const { error: insertError } = await db.from("register_attempts").insert({ ip_hash: key });
    if (insertError) throw insertError;
    // Old rows go here (there is no daily job any more): cheap, and it keeps the two-day promise.
    await db.from("register_attempts").delete().lt("created_at", new Date(now - KEEP_MS).toISOString());
    return retryAfter([...data.map((r: { created_at: string }) => Date.parse(r.created_at)), now], now);
  } catch (e) {
    console.error("register: rate limit check failed, letting the request through", e);
    return 0;
  }
}
