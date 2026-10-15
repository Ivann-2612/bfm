// CORS and small helpers shared by the Supabase functions (Deno).
// ALLOWED_ORIGINS: comma-separated, e.g. "https://belgrademagicfestival.rs,https://www.belgrademagicfestival.rs".
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : (ALLOWED[0] ?? ""),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-admin-key",
    "Access-Control-Expose-Headers": "content-disposition, retry-after",
    Vary: "Origin",
  };
}

/** Browsers always send Origin with fetch POSTs; scripts posting from elsewhere usually don't. */
export const allowedOrigin = (req: Request) => ALLOWED.includes(req.headers.get("origin") ?? "");

export const json = (req: Request, body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(req), ...extra } });

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison (hashes first, so neither content nor length leaks through timing). */
export async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0 && a.length === b.length;
}
