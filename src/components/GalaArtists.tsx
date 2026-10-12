import { SUITS, site, type Artist } from "@/lib/content";
import { GalaArtistsGrid } from "./GalaArtistsGrid";
import { SectionHead, SuitMark, type LangProps } from "./ui";

export function GalaArtists({ lang }: LangProps) {
  const s = site(lang);
  const { gala, programs, ui } = s.c;
  const artists = (gala.artists as Artist[])
    .filter((a) => !a.hidden)
    .map((a, i) => ({ ...a, suit: SUITS[i % SUITS.length], initial: a.name.charAt(0) }));
  if (artists.length === 0) return null;
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
        <GalaArtistsGrid
          artists={artists}
          labels={{ photo: ui.photoPlaceholder, bioSoon: ui.bioSoon, close: ui.close, about: ui.aboutArtist }}
        />
      </div>
    </section>
  );
}
