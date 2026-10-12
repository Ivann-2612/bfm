import { site } from "@/lib/content";
import { Photo, SectionHead, SuitMark, type LangProps } from "./ui";

export function Programs({ lang }: LangProps) {
  const s = site(lang);
  const { programs, ui } = s.c;
  const [lead, ...rest] = programs.items;

  return (
    <section className="section programs" aria-labelledby="programs-title">
      <div className="wrap">
        <SectionHead id="programs-title" kicker={programs.kicker} title={programs.title} intro={programs.intro} />
        <div className="programs__grid">
          <article className="program program--lead">
            <Photo
              src={lead.photo.src}
              alt={lead.photo.alt}
              label={ui.photoPlaceholder}
              sizes="(min-width: 900px) 58vw, 100vw"
              className="program__photo"
            />
            <div className="program__body">
              <p className="program__meta">{lead.meta}</p>
              <h3 className="program__name">{lead.name}</h3>
              <p>{lead.text}</p>
              {lead.shows.length > 0 && (
                <ul className="program__shows">
                  {lead.shows.map((show) => (
                    <li key={show.date}>
                      <SuitMark suit={s.dayFor(show.date).suit} />
                      <span>
                        {s.shortWeekday(show.date)}, {s.longDate(show.date)}
                      </span>
                      <b>{show.time}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <ul className="programs__rest">
            {rest.map((p) => (
              <li key={p.id} className="program program--row">
                <Photo
                  src={p.photo.src}
                  alt={p.photo.alt}
                  label={ui.photoPlaceholder}
                  sizes="(min-width: 900px) 14vw, 30vw"
                  className="program__thumb"
                />
                <div>
                  <p className="program__meta">{p.meta}</p>
                  <h3 className="program__name program__name--small">{p.name}</h3>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
