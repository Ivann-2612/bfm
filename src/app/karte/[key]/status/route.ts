import { NextResponse, type NextRequest } from "next/server";
import { STATUSES, isAdminKey, type Status } from "@/lib/server/admin";
import { supabaseAdmin } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Changes one registration's status from the /karte page. Same protection as the page:
// the secret key in the URL. paid_at is set by the database trigger when status becomes "paid".
export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAdminKey(key)) return new NextResponse("Not found", { status: 404 });

  const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status as Status;
  if (!UUID.test(id) || !STATUSES.includes(status)) {
    return NextResponse.json({ message: "Neispravan zahtev." }, { status: 400 });
  }

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ message: "Baza nije povezana." }, { status: 503 });

  const { data, error } = await db.from("registrations").update({ status }).eq("id", id).select("id, status").maybeSingle();
  if (error) return NextResponse.json({ message: `Greška baze: ${error.message}` }, { status: 500 });
  if (!data) return NextResponse.json({ message: "Prijava više ne postoji." }, { status: 404 });
  return NextResponse.json({ ok: true, status: data.status });
}
