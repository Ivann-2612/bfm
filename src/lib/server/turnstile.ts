import "server-only";

// With no Turnstile keys configured, the form's honeypot field (checked in /api/register)
// is the only bot filter. Add TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable it.
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success;
}
