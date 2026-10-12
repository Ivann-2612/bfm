import { SUITS, site, type Suit } from "@/lib/content";
import { Photo, SectionHead, SuitMark, type LangProps } from "./ui";

// Playing-card corner: the artist's initial over a suit.
function Index({ initial, suit, flip = false }: { initial: string; suit: Suit; flip?: boolean }) {
  return (
    <span className={`artist__index ${flip ? "artist__index--flip" : ""}`} aria-hidden="true">
      <span>{initial}</span>
      <SuitMark suit={suit} />
    </span>
  );
}

export function GalaArtists({ lang }: LangProps) {
  const s = site(lang);
  const { gala, programs, ui } = s.c;
  if (gala.artists.length === 0) return null;
  // Show times come from the gala programme item, so they can't drift from the schedule.
  const shows = programs.items.find((p) => p.id === "varijete")?.shows ?? [];

  return (
    <section id="izvodjaci" className="section artists" aria-labelledby="artists-title">
      <div className="wrap">
        <div className="artists__head">
          <SectionHead id="artists-title" kicker={gala.kicker} title={gala.title} intro={gala.intro} />
          {shows.length > 0 && (
            <ul className="artists__shows">
              {shows.map((show) => (
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
        <ul className="artists__grid">
          {gala.artists.map((a, i) => {
            const suit = SUITS[i % SUITS.length];
            const initial = a.name.charAt(0);
            return (
              <li key={a.name} className="artist">
                <div className="artist__card">
                  <Index initial={initial} suit={suit} />
                  <Photo
                    src={a.photo}
                    alt={a.name}
                    label={ui.photoPlaceholder}
                    sizes="(min-width: 900px) 22vw, 45vw"
                    className="artist__photo"
                  />
                  <Index initial={initial} suit={suit} flip />
                </div>
                <span className="artist__name">{a.name}</span>
                <span className="artist__country">{a.country}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
