"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { STATUS_LABEL, STATUSES, type Status, type Ticket } from "@/lib/tickets";

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

export function TicketsTable({
  tickets: initial,
  onReload,
  onStatus,
  demo,
}: {
  tickets: Ticket[];
  /** Loads the list again (the page keeps it in state, so filter, sort and scroll stay). */
  onReload: () => Promise<void>;
  /** Saves one status change; throws with a message when it fails. */
  onStatus: (id: string, status: Status) => Promise<void>;
  /** Local preview with sample rows: change status in the browser only. */
  demo: boolean;
}) {
  // Fresh data without a page reload. Runs every 30 s while the tab is visible, when the tab
  // regains focus, and on the "Refresh" button.
  const [refreshing, startRefresh] = useTransition();
  const refresh = useCallback(() => {
    if (demo) return;
    startRefresh(async () => {
      await onReload();
    });
  }, [demo, onReload]);
  useEffect(() => {
    if (demo) return;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30_000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demo, refresh]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "ts", dir: -1 });
  // Optimistic status changes, dropped once the refreshed server data arrives.
  const [overrides, setOverrides] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!demo) setOverrides({});
  }, [initial, demo]);

  const tickets = useMemo(
    () => initial.map((t) => (overrides[t.id] ? { ...t, status: overrides[t.id] } : t)),
    [initial, overrides],
  );

  async function changeStatus(t: Ticket, status: Status) {
    if (status === t.status) return;
    setMessage(null);
    setOverrides((o) => ({ ...o, [t.id]: status }));
    if (demo) return;
    setSaving(t.id);
    try {
      await onStatus(t.id, status);
      setMessage(`${t.name}: ${STATUS_LABEL[status]}`);
      void onReload(); // updates the totals above; filter and sort stay as they are
    } catch (e) {
      setOverrides((o) => {
        const { [t.id]: _, ...rest } = o;
        return rest;
      });
      setMessage(`Nije sačuvano (${t.name}): ${(e as Error).message}`);
    } finally {
      setSaving(null);
    }
  }

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

  // Phones have no column headers to click, so sorting comes from a select.
  const MOBILE_SORTS: { id: string; label: string; key: SortKey; dir: 1 | -1 }[] = [
    { id: "new", label: "Najnovije prvo", key: "ts", dir: -1 },
    { id: "old", label: "Najstarije prvo", key: "ts", dir: 1 },
    { id: "name", label: "Ime A–Ž", key: "name", dir: 1 },
    { id: "total", label: "Iznos, najveći prvo", key: "total", dir: -1 },
    { id: "status", label: "Po statusu", key: "status", dir: 1 },
  ];
  const mobileSort = MOBILE_SORTS.find((m) => m.key === sort.key && m.dir === sort.dir)?.id ?? "";

  const statusSelect = (t: Ticket) => (
    <>
      <select
        className={`admin__status admin__status--${t.status}`}
        value={t.status}
        disabled={saving === t.id}
        onChange={(e) => changeStatus(t, e.target.value as Status)}
        aria-label={`Status: ${t.name}`}
      >
        {STATUSES.map((st) => (
          <option key={st} value={st}>
            {STATUS_LABEL[st]}
          </option>
        ))}
      </select>
      {saving === t.id && <small>Čuvam…</small>}
    </>
  );

  return (
    <>
      {!demo && (
        <div className="admin__refresh">
          <button type="button" className="admin__refresh-btn" onClick={refresh} disabled={refreshing}>
            <span aria-hidden="true" className={refreshing ? "is-spinning" : ""}>
              ↻
            </span>{" "}
            {refreshing ? "Osvežavam…" : "Osveži"}
          </button>
          <span className="admin__refresh-note">Automatski na 30 s i kad se vratiš na ovaj tab</span>
        </div>
      )}

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

      <p className="admin__message" role="status" aria-live="polite">
        {message}
      </p>

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
                <td>{statusSelect(t)}</td>
                <td className="admin__notes">{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="admin__empty admin__empty--inline">Nema prijava sa ovim statusom.</p>}
      </div>

      {/* Phones: one card per registration instead of the wide table (CSS switches between them). */}
      <div className="admin__mobile-sort">
        <label>
          Redosled
          <select
            value={mobileSort}
            onChange={(e) => {
              const m = MOBILE_SORTS.find((x) => x.id === e.target.value);
              if (m) setSort({ key: m.key, dir: m.dir });
            }}
          >
            {MOBILE_SORTS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="admin__cards">
        {rows.map((t) => (
          <li key={t.id} className={`admin__card is-${t.status}`}>
            <div className="admin__card-top">
              <div>
                <b className="admin__card-name">{t.name}</b>
                <small>
                  {t.received} · {t.lang.toUpperCase()}
                </small>
              </div>
              <div className="admin__card-status">{statusSelect(t)}</div>
            </div>
            <div className="admin__card-row">
              <span>
                {t.packageName}
                {t.early && <small>rana prijava</small>}
                {t.extras && <small>{t.extras}</small>}
              </span>
              <b className="admin__card-total">{t.totalText}</b>
            </div>
            <div className="admin__card-contact">
              <a href={`mailto:${t.email}`}>{t.email}</a>
              {t.phone && <a href={`tel:${t.phone.replace(/\s/g, "")}`}>{t.phone}</a>}
              <span>{t.country}</span>
            </div>
            {t.notes && <p className="admin__card-notes">{t.notes}</p>}
          </li>
        ))}
        {rows.length === 0 && <li className="admin__empty">Nema prijava sa ovim statusom.</li>}
      </ul>
    </>
  );
}
