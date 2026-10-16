"use client";

import { useCallback, useEffect, useState } from "react";

type Person = {
  received: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  package: string;
  hotel: string;
  contest: string;
  payment: string;
  amount: number;
  paid: string;
  fism: string;
};
type Totals = {
  registrations: number;
  standard: number;
  dealer: number;
  fism: number;
  hotel: number;
  closeUp: number;
  stage: number;
  expected: number;
  paidAmount: number;
  paid: number;
  waiting: number;
  cancelled: number;
  fismPending: number;
};
type State =
  | { kind: "nokey" }
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "error"; message: string }
  | { kind: "ok"; updated: string; totals: Totals; people: Person[] };

const euro = new Intl.NumberFormat("sr-Latn-RS", { style: "currency", currency: "EUR" });

export function SheetData({ api }: { api: string }) {
  const [key, setKey] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const read = () => setKey(decodeURIComponent(location.hash.slice(1)));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const load = useCallback(async () => {
    if (key === null) return;
    if (!key || !api) return setState({ kind: "nokey" });
    setState((s) => (s.kind === "ok" ? s : { kind: "loading" }));
    try {
      const res = await fetch(`${api}?key=${encodeURIComponent(key)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.error === "denied") return setState({ kind: "denied" });
      if (data.error) return setState({ kind: "error", message: data.error });
      setState({ kind: "ok", updated: data.updated, totals: data.totals, people: data.people });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }, [api, key]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === "nokey") return null;
  if (state.kind === "loading") return <p className="admin__hint">Učitavam prijave iz tabele…</p>;
  if (state.kind === "denied") return <p className="admin__error">Pogrešan ključ posle # u adresi.</p>;
  if (state.kind === "error") return <p className="admin__error">Podaci nisu učitani: {state.message}</p>;

  const t = state.totals;
  const figures: [string, string | number][] = [
    ["Prijava", t.registrations],
    ["Očekivano", euro.format(t.expected)],
    ["Uplaćeno", euro.format(t.paidAmount)],
    ["Plaćeno / čeka", `${t.paid} / ${t.waiting}`],
    ["Standard / Dealer", `${t.standard} / ${t.dealer}`],
    ["Hotel", t.hotel],
    ["Takmičenje (close-up / scena)", `${t.closeUp} / ${t.stage}`],
    ["FISM (čeka proveru)", `${t.fism} (${t.fismPending})`],
  ];

  return (
    <section className="sheet-data">
      <div className="sheet-data__head">
        <p className="admin__asof">Stanje iz tabele: {state.updated}</p>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => void load()}>
          Osveži
        </button>
      </div>
      <dl className="admin__figures">
        {figures.map(([label, value], i) => (
          <div key={label} className={i === 0 ? "admin__figure--lead" : undefined}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {state.people.length === 0 ? (
        <p className="admin__empty">Još nema prijava.</p>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                {["Primljeno", "Ime i prezime", "Kontakt", "Država", "Paket", "Hotel", "Takmičenje", "Plaćanje", "Iznos", "Uplata", "FISM"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.people.map((p) => (
                <tr key={`${p.received}-${p.email}`}>
                  <td className="admin__nowrap">{p.received}</td>
                  <td>{p.name}</td>
                  <td>
                    <a href={`mailto:${p.email}`}>{p.email}</a>
                    <br />
                    {p.phone}
                  </td>
                  <td>{p.country}</td>
                  <td>{p.package}</td>
                  <td>{p.hotel}</td>
                  <td>{p.contest}</td>
                  <td>{p.payment}</td>
                  <td className="admin__nowrap">{euro.format(p.amount)}</td>
                  <td>{p.paid}</td>
                  <td>{p.fism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
