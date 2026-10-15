import { site, type ScheduleItem } from "@/lib/content";
import { SectionHead, SuitMark, type LangProps } from "./ui";

// Both days side by side (stacked on phones), so the whole programme is always in view.
export function Schedule({ lang }: LangProps) {
  const s = site(lang);
  const { schedule } = s.c;

  return (
    <section id="program" className="section schedule" aria-labelledby="schedule-title">
      <div className="wrap">
        <SectionHead id="schedule-title" kicker={schedule.kicker} title={schedule.title} intro={s.dateRange()} />
        <div className="schedule__days" style={{ "--n": s.days.length } as React.CSSProperties}>
          {s.days.map((d) => (
            // id: the date cards in the hero link here (#tab-<date>).
            <article key={d.date} id={`tab-${d.date}`} className="schedule__col" aria-labelledby={`day-${d.date}`}>
              <h3 id={`day-${d.date}`} className="schedule__head">
                <SuitMark suit={d.suit} className="schedule__suit" />
                <span className="schedule__day">{s.weekday(d.date)}</span>
                <span className="schedule__num">{s.longDate(d.date)}</span>
              </h3>
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
            </article>
          ))}
        </div>
        <p className="schedule__note">{schedule.note}</p>
      </div>
    </section>
  );
}
