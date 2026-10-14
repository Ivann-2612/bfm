import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// The visitor's country as Vercel sees it (from the IP), only to pre-fill the country field.
// Nothing is stored; the IP itself never leaves Vercel's edge. Locally there is no header: null.
export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country");
  return NextResponse.json(
    { country: country && /^[A-Z]{2}$/.test(country) ? country : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
