import { notFound } from "next/navigation";
import { getContent, site, DEFAULT_LANG } from "@/lib/content";
import { isAdminKey, loadTickets } from "@/lib/server/admin";
import { TicketsTable } from "@/components/TicketsTable";

export const dynamic = "force-dynamic";

export default async function Tickets({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAdminKey(key)) notFound();

  const { event, site: meta } = getContent(DEFAULT_LANG);
  const { tickets, error, demo } = await loadTickets();
  const now = new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "long", timeStyle: "short", timeZone: meta.timeZone }).format(new Date());
  const active = tickets.filter((t) => t.status === "pending" || t.status === "paid");
  const paid = tickets.filter((t) => t.status === "paid");
  const money = site(DEFAULT_LANG).money;

  return (
    <main className="admin wrap">
      <header className="admin__head">
        <div>
          <p className="kicker">
            {event.name} {event.year}
          </p>
          <h1 className="section-title">Karte</h1>
          <p className="admin__asof">Stanje: {now}</p>
        </div>
        {!demo && tickets.length > 0 && (
          <a className="btn btn--small" href={`/karte/${key}/csv`}>
            Preuzmi CSV (Excel)
          </a>
        )}
      </header>

      {error && (
        <p className="admin__error">
          {error}
          {demo && " Prikazani su primer podaci, samo za lokalni pregled."}
        </p>
      )}

      {(!error || demo) && (
        <>
          <dl className="admin__figures">
            <div className="admin__figure--lead">
              <dt>Ukupno prijava do sada</dt>
              <dd>{tickets.length}</dd>
            </div>
            <div>
              <dt>Aktivne (čekaju ili plaćene)</dt>
              <dd>{active.length}</dd>
            </div>
            <div>
              <dt>Očekivani iznos</dt>
              <dd>{money(active.reduce((sum, t) => sum + t.total, 0))}</dd>
            </div>
            <div>
              <dt>Uplaćeno</dt>
              <dd>{money(paid.reduce((sum, t) => sum + t.total, 0))}</dd>
            </div>
          </dl>

          {tickets.length === 0 ? (
            <p className="admin__empty">Još nema prijava. Kad stigne prva, pojaviće se ovde.</p>
          ) : (
            <TicketsTable tickets={tickets} />
          )}

          <p className="admin__hint">
            Status menjaš u Supabase → Table Editor → registrations (kolona status: pending, paid, expired, cancelled), pa
            osvežiš ovu stranicu. Ovu adresu ne prosleđuj: ko je ima, vidi sve prijave.
          </p>
        </>
      )}
    </main>
  );
}
