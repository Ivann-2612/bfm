import { site } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function Hotels({ lang }: LangProps) {
  const s = site(lang);
  if (s.hotels.length === 0) return null;
  const { ui } = s.c;
  return (
    <section id="hoteli" className="section hotels" aria-labelledby="hotels-title">
      <div className="wrap">
        <SectionHead id="hotels-title" kicker={s.c.hotels.kicker} title={s.c.hotels.title} />
        <ul className="hotels__list">
          {s.hotels.map((h, i) => (
            <li key={i}>
              <span className="hotels__name">
                {h.name}{" "}
                <span className="hotels__stars" aria-label={`${h.stars}★`}>
                  {"★".repeat(h.stars)}
                </span>
              </span>
              <span className="hotels__distance">{h.distance}</span>
              <span className="hotels__price">
                {ui.from} {s.money(h.priceFrom)} / {ui.perNight}
              </span>
              {h.url ? (
                <a href={h.url} className="link-arrow" target="_blank" rel="noopener noreferrer">
                  {ui.book}
                </a>
              ) : (
                <span className="muted">{ui.bookingSoon}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
