import { createClient } from "npm:@supabase/supabase-js@2";

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to every function by Supabase.
// The service role bypasses RLS; it never leaves the function.
export const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
