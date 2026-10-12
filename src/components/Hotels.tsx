import { site } from "@/lib/content";
import { SectionHead, type LangProps } from "./ui";

export function Hotels({ lang }: LangProps) {
  const s = site(lang);
  const h = s.c.hotels;
  if (h.rooms.length === 0) return null;

  return (
    <section id="smestaj" className="section hotels" aria-labelledby="hotels-title">
      <div className="wrap hotels__grid">
        <SectionHead id="hotels-title" kicker={h.kicker} title={h.title} intro={h.intro} />
        <div>
          <ul className="hotels__rooms">
            {h.rooms.map((r) => (
              <li key={r.label}>
                <span className="hotels__room">
                  {r.label}
                  {r.note && <small> · {r.note}</small>}
                </span>
                <span className="hotels__price">
                  {s.money(r.price)} <small>/ {s.c.ui.perNight}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="hotels__note">{h.note}</p>
        </div>
      </div>
    </section>
  );
}
