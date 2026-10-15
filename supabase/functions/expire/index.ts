import { json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${Deno.env.get("CRON_SECRET") ?? ""}`;
  if (
    auth !== expected &&
    auth !== `Bearer ${Deno.env.get("CRON_SECRET") ?? ""}`
  ) {
    return json(req, { message: "Unauthorized" }, 401);
  }

  return json(req, { ok: true, message: "cron/expire: ok" }, 200);
});
