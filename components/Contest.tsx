import Image from "next/image";
import { site } from "@/lib/content";
import type { LangProps } from "./ui";

export function Contest({ lang }: LangProps) {
  const { c, jury, dateRange } = site(lang);
  const { contest, event } = c;
  return (
    <section id="takmicenje" className="section contest" aria-labelledby="contest-title">
      <div className="wrap contest__grid">
        <header className="contest__head">
          <div className="contest__logos">
            {contest.logos.map((l) => (
              <Image key={l.src} src={l.src} alt={l.alt} width={l.width} height={l.height} sizes="7rem" />
            ))}
          </div>
          <p className="contest__badge">{contest.badge}</p>
          <h2 id="contest-title" className="section-title">
            {contest.title}
          </h2>
          <p className="section-intro">{contest.lead}</p>
        </header>
        <div className="contest__body">
          {contest.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="contest__jury">
            <h3>{contest.juryTitle}</h3>
            <ul>
              {jury.map((j) => (
                <li key={j.name}>
                  <a href="#ziri">{j.name}</a>
                </li>
              ))}
            </ul>
          </div>
          {contest.closing.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="contest__sign">
            <b>
              {event.name} {event.year}
            </b>
            <span>
              {dateRange()} · {event.venue}, {event.city}, {event.country}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
