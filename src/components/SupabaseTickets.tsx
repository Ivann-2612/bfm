"use client";

import { useCallback, useEffect, useState } from "react";
import { getContent, site, ORGANIZER_LANG } from "@/lib/content";
import { DEMO_ROWS, toTicket, type Status, type Ticket } from "@/lib/tickets";
import { TicketsTable } from "@/components/TicketsTable";

const FUNCTIONS_URL = (process.env.NEXT_PUBLIC_FUNCTIONS_URL ?? "https://pnpylpzcgoulsivplhip.supabase.co/functions/v1").replace(/\/+$/, "");
const FN = `${FUNCTIONS_URL}/tickets`;
const isDev = process.env.NODE_ENV === "development";
const DEV_KEY = "lokalno";

const { event, site: meta } = getContent(ORGANIZER_LANG);
const money = site(ORGANIZER_LANG).money;
const stamp = () =>
  new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "long", timeStyle: "medium", timeZone: meta.timeZone }).format(new Date());

type State =
  | { kind: "loading" }
  | { kind: "nokey" }
  | { kind: "denied" }
  | { kind: "error"; message: string }
  | { kind: "ok"; tickets: Ticket[]; at: string; demo: boolean };

export function SupabaseTickets() {
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const read = () => setKey(decodeURIComponent(location.hash.slice(1)) || "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const load = useCallback(async () => {
    if (key === null) return;
    if (!key) return setState({ kind: "nokey" });
    if (isDev && key === DEV_KEY) return setState({ kind: "ok", tickets: DEMO_ROWS.map(toTicket), at: stamp(), demo: true });
    try {
      const res = await fetch(FN, { headers: { "x-admin-key": key }, cache: "no-store" });
      if (res.status === 404) return setState({ kind: "denied" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setState({ kind: "error", message: data.message ?? `Greška ${res.status}` });
      setState({ kind: "ok", tickets: data.tickets as Ticket[], at: stamp(), demo: false });
    } catch (e) {
      setState({ kind: "error", message: `Baza nije dostupna: ${(e as Error).message}` });
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStatus = useCallback(
    async (id: string, status: Status) => {
      const res = await fetch(FN, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key ?? "" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Nije sačuvano.");
    },
    [key],
  );

  const downloadCsv = async () => {
    const res = await fetch(`${FN}?format=csv`, { headers: { "x-admin-key": key ?? "" }, cache: "no-store" });
    if (!res.ok) return setState({ kind: "error", message: "CSV nije preuzet." });
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: `karte-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const tickets = state.kind === "ok" ? state.tickets : [];
  const active = tickets.filter((t) => t.status === "pending" || t.status === "paid");
  const paid = tickets.filter((t) => t.status === "paid");

  return (
    <main className="admin wrap">
      <header className="admin__head">
        <div>
          <p className="kicker">
            {event.name} {event.year}
          </p>
          <h1 className="section-title">Karte</h1>
          {state.kind === "ok" && <p className="admin__asof">Poslednje osvežavanje podataka: {state.at}</p>}
        </div>
        {state.kind === "ok" && !state.demo && tickets.length > 0 && (
          <button type="button" className="btn btn--small" onClick={downloadCsv}>
            Preuzmi CSV (Excel)
          </button>
        )}
      </header>

      {state.kind === "loading" && <p className="admin__hint">Učitavam prijave…</p>}
      {state.kind === "nokey" && <p className="admin__error">Adresa stranice nije potpuna: posle /karte/# ide ključ.</p>}
      {state.kind === "denied" && <p className="admin__error">Pogrešan ključ.</p>}
      {state.kind === "error" && <p className="admin__error">{state.message}</p>}

      {state.kind === "ok" && (
        <>
          {state.demo && <p className="admin__error">Primer podaci, samo za lokalni pregled.</p>}
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
            <TicketsTable tickets={tickets} onReload={load} onStatus={saveStatus} demo={state.demo} />
          )}

          <p className="admin__hint">
            Status menjaš u padajućem meniju kod svake prijave: izmena se odmah čuva u bazi. Ovu adresu ne prosleđuj: ko je ima, vidi sve
            prijave.
          </p>
        </>
      )}
    </main>
  );
}
