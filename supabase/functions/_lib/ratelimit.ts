import { db } from "./db.ts";
import { sha256 } from "./http.ts";

const LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 5 },
  { windowMs: 24 * 60 * 60 * 1000, max: 30 },
];
const KEEP_MS = 2 * 24 * 60 * 60 * 1000;

const hashIp = (ip: string) => sha256(`${Deno.env.get("ADMIN_KEY") ?? ""}|${new Date().toISOString().slice(0, 10)}|${ip}`).then((h) => h.slice(0, 32));

function retryAfter(times: number[], now: number) {
  for (const { windowMs, max } of LIMITS) {
    const inWindow = times.filter((t) => now - t < windowMs).sort((a, b) => a - b);
    if (inWindow.length > max) return Math.ceil((inWindow[inWindow.length - max - 1] + windowMs - now) / 1000);
  }
  return 0;
}

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
    await db.from("register_attempts").delete().lt("created_at", new Date(now - KEEP_MS).toISOString());
    return retryAfter([...data.map((r: { created_at: string }) => Date.parse(r.created_at)), now], now);
  } catch (e) {
    console.error("register: rate limit check failed, letting the request through", e);
    return 0;
  }
}
