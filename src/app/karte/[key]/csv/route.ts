import { NextResponse, type NextRequest } from "next/server";
import { STATUS_LABEL, isAdminKey, loadTickets } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

// Semicolon-separated with a UTF-8 BOM: opens correctly (with č/ć/ž) in Excel set to Serbian.
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAdminKey(key)) return new NextResponse("Not found", { status: 404 });

  const { tickets, error, demo } = await loadTickets();
  if (error || demo) return new NextResponse(error ?? "Baza nije dostupna", { status: 503 });

  const header = ["Primljeno", "Ime i prezime", "Email", "Telefon", "Država", "Jezik", "Paket", "Dodaci", "Cena", "Iznos EUR", "Status", "Napomena"];
  const lines = tickets.map((t) =>
    [
      t.received,
      t.name,
      t.email,
      t.phone,
      t.country,
      t.lang,
      t.packageName,
      t.extras,
      t.early ? "rana prijava" : "redovna",
      t.total,
      STATUS_LABEL[t.status],
      t.notes,
    ]
      .map(cell)
      .join(";"),
  );
  const csv = "\uFEFF" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karte-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
