"use client";

import { useMemo, useState } from "react";
import type { Status, Ticket } from "@/lib/server/admin";

// Mirrors STATUS_LABEL in lib/server/admin.ts (that module is server-only).
const STATUS_LABEL: Record<Status, string> = {
  pending: "Čeka uplatu",
  paid: "Plaćeno",
  expired: "Isteklo",
  cancelled: "Otkazano",
};
const STATUSES = Object.keys(STATUS_LABEL) as Status[];

type SortKey = "ts" | "name" | "country" | "packageName" | "total" | "status";
const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: "ts", label: "Primljeno" },
  { key: "name", label: "Ime i prezime" },
  { key: null, label: "Kontakt" },
  { key: "country", label: "Država" },
  { key: "packageName", label: "Paket" },
  { key: "total", label: "Iznos" },
  { key: "status", label: "Status" },
  { key: null, label: "Napomena" },
];

export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "ts", dir: -1 });

  const counts = useMemo(() => {
    const c = { all: tickets.length } as Record<Status | "all", number>;
    for (const st of STATUSES) c[st] = tickets.filter((t) => t.status === st).length;
    return c;
  }, [tickets]);

  const rows = useMemo(() => {
    const list = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
    const order = (t: Ticket) => (sort.key === "status" ? STATUSES.indexOf(t.status) : t[sort.key]);
    return [...list].sort((a, b) => {
      const x = order(a);
      const y = order(b);
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "sr");
      return cmp * sort.dir;
    });
  }, [tickets, filter, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "ts" || key === "total" ? -1 : 1 }));

  return (
    <>
      <div className="admin__filters" role="group" aria-label="Prikaži po statusu">
        {(["all", ...STATUSES] as const).map((st) => (
          <button
            key={st}
            type="button"
            className={`admin__filter ${st !== "all" ? `admin__filter--${st}` : ""}`}
            aria-pressed={filter === st}
            onClick={() => setFilter(st)}
          >
            {st === "all" ? "Sve" : STATUS_LABEL[st]} <b>{counts[st]}</b>
          </button>
        ))}
      </div>

      <div className="admin__table-wrap">
        <table className="admin__table">
          <thead>
            <tr>
              <th>#</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  aria-sort={col.key && sort.key === col.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                >
                  {col.key ? (
                    <button type="button" className="admin__sort" onClick={() => toggleSort(col.key!)}>
                      {col.label}
                      <span aria-hidden="true">{sort.key === col.key ? (sort.dir === 1 ? " ↑" : " ↓") : " ↕"}</span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} className={`is-${t.status}`}>
                <td>{i + 1}</td>
                <td className="admin__nowrap">{t.received}</td>
                <td>
                  <b>{t.name}</b>
                  <small>{t.lang.toUpperCase()}</small>
                </td>
                <td>
                  <a href={`mailto:${t.email}`}>{t.email}</a>
                  {t.phone && <small>{t.phone}</small>}
                </td>
                <td>{t.country}</td>
                <td>
                  {t.packageName}
                  {t.early && <small>rana prijava</small>}
                  {t.extras && <small>{t.extras}</small>}
                </td>
                <td className="admin__nowrap">{t.totalText}</td>
                <td>
                  <span className={`admin__status admin__status--${t.status}`}>{STATUS_LABEL[t.status]}</span>
                </td>
                <td className="admin__notes">{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="admin__empty admin__empty--inline">Nema prijava sa ovim statusom.</p>}
      </div>
    </>
  );
}
