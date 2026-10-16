import { json, safeEqual } from "../_lib/http.ts";

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (secret.length < 16 || !(await safeEqual(auth, `Bearer ${secret}`))) {
    return json(req, { message: "Unauthorized" }, 401);
  }

  return json(req, { ok: true, message: "cron/expire: ok" }, 200);
});
