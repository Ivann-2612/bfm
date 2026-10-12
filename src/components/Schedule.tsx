"use client";

import { useRef, useState } from "react";
import { site, type ScheduleItem } from "@/lib/content";
import { SectionHead, SuitMark, type LangProps } from "./ui";

export function Schedule({ lang }: LangProps) {
  const s = site(lang);
  const { schedule, ui } = s.c;
  const days = s.days;
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = (i + dir + days.length) % days.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section id="program" className="section schedule" aria-labelledby="schedule-title">
      <div className="wrap">
        <SectionHead id="schedule-title" kicker={schedule.kicker} title={schedule.title} intro={s.dateRange()} />
        <div role="tablist" aria-label={ui.daysNav} className="schedule__tabs" style={{ "--n": days.length } as React.CSSProperties}>
          {days.map((d, i) => (
            <button
              key={d.date}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`tab-${d.date}`}
              aria-controls={`panel-${d.date}`}
              aria-selected={active === i}
              tabIndex={active === i ? 0 : -1}
              className="schedule__tab"
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <SuitMark suit={d.suit} className="schedule__suit" />
              <span className="schedule__day">{s.shortWeekday(d.date)}</span>
              <span className="schedule__num">{s.longDate(d.date)}</span>
            </button>
          ))}
        </div>

        {days.map((d, i) => (
          <div
            key={d.date}
            role="tabpanel"
            id={`panel-${d.date}`}
            aria-labelledby={`tab-${d.date}`}
            hidden={active !== i}
            className="schedule__panel"
          >
            <h3 className="visually-hidden">
              {s.weekday(d.date)}, {s.longDate(d.date)}
            </h3>
            <div className="schedule__groups">
              {d.groups.map((g) => (
                <section key={g.title} className="schedule__group">
                  <h4 className="schedule__group-title">{g.title}</h4>
                  <ol className="schedule__list">
                    {(g.items as ScheduleItem[]).map((it, j) => (
                      <li key={j} className={it.highlight ? "is-highlight" : ""}>
                        <time className="schedule__time">{it.time}</time>
                        <div>
                          <span className="schedule__title">{it.title}</span>
                          {it.place && <span className="schedule__place">{it.place}</span>}
                          {it.text && <p className="schedule__text">{it.text}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        ))}
        <p className="schedule__note">{schedule.note}</p>
      </div>
    </section>
  );
}
