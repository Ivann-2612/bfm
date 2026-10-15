import { site } from "@/lib/content";
import { Photo, SectionHead, type LangProps } from "./ui";

// Lecturers as playing cards: photo, name, what they do and where they come from. No bios here
// (the artists' bios are in the gala section, so they aren't repeated).
export function Lecturers({ lang }: LangProps) {
  const { c, lecturers } = site(lang);
  if (lecturers.length === 0) return null;
  const { ui } = c;

  return (
    <section id="predavaci" className="section lecturers" aria-labelledby="lecturers-title">
      <div className="wrap">
        <SectionHead id="lecturers-title" kicker={c.lecturers.kicker} title={c.lecturers.title} />
        <ul className="lecturers__grid">
          {lecturers.map((l, i) => (
            <li key={i}>
              <div className="pcard pcard--static">
                <span className="pcard__inner">
                  <span className="pcard__face pcard__front">
                    <Photo src={l.photo} alt={l.name} label={ui.photoPlaceholder} sizes="(min-width: 640px) 260px, 240px" className="pcard__photo" />
                    <span className="pcard__caption">
                      <span className="pcard__name">{l.name}</span>
                      <span className="pcard__meta">
                        {l.specialty} · {l.country}
                      </span>
                    </span>
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        {/* Phones: a plain list instead of a sideways strip of cards. */}
        <ul className="lecturers__list">
          {lecturers.map((l, i) => (
            <li key={i}>
              <Photo src={l.photo} alt={l.name} label={ui.photoPlaceholder} sizes="7rem" className="lecturers__thumb" />
              <div>
                <h3 className="lecturers__name">{l.name}</h3>
                <p className="lecturers__meta">
                  {l.specialty} · {l.country}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
