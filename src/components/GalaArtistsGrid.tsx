"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Artist, Suit } from "@/lib/content";
import { Photo, SuitMark } from "./ui";

export type ArtistCard = Artist & { suit: Suit; initial: string };
type Labels = { photo: string; bioSoon: string; close: string; about: string };

// Playing-card corner: the artist's initial over a suit.
function Index({ initial, suit, flip = false }: { initial: string; suit: Suit; flip?: boolean }) {
  return (
    <span className={`artist__index ${flip ? "artist__index--flip" : ""}`} aria-hidden="true">
      <span>{initial}</span>
      <SuitMark suit={suit} />
    </span>
  );
}

// The first card starts open; clicking a card opens its panel below the grid with a larger photo and the bio
// (bio text comes from "bio" in the JSON; empty shows the "coming soon" line).
export function GalaArtistsGrid({ artists, labels }: { artists: ArtistCard[]; labels: Labels }) {
  // The first artist starts open, so the section never looks empty.
  const [open, setOpen] = useState<number | null>(artists.length > 0 ? 0 : null);
  // Scroll to the panel only after a click, never on page load.
  const clicked = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  // Connector from the open card down to the panel: x = card centre, height = gap to the panel.
  const [link, setLink] = useState<{ x: number; h: number } | null>(null);
  const current = open === null ? null : artists[open];

  useLayoutEffect(() => {
    function measure() {
      const li = open === null ? null : items.current[open];
      if (!li || !panel.current) return setLink(null);
      const p = panel.current.getBoundingClientRect();
      const r = li.getBoundingClientRect();
      // Only when no row of cards sits between the open card and the panel (phones wrap into rows).
      const cardsBelow = items.current.some((el) => el && el.getBoundingClientRect().top > r.top + 4);
      setLink(cardsBelow ? null : { x: r.left + r.width / 2 - p.left, h: p.top - r.bottom });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  useEffect(() => {
    if (open === null || !panel.current || !clicked.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [open]);

  return (
    <>
      <ul className="artists__grid">
        {artists.map((a, i) => (
          <li
            key={a.name}
            ref={(el) => {
              items.current[i] = el;
            }}
            className={`artist ${open === i ? "is-active" : ""}`}
          >
            <button
              type="button"
              className="artist__button"
              aria-expanded={open === i}
              aria-controls="artist-panel"
              aria-label={`${labels.about}: ${a.name}`}
              onClick={() => {
                clicked.current = true;
                setOpen(open === i ? null : i);
              }}
            >
              <span className="artist__card">
                <Index initial={a.initial} suit={a.suit} />
                <Photo src={a.photo} alt={a.name} label={labels.photo} sizes="(min-width: 1080px) 160px, (min-width: 600px) 25vw, 48vw" className="artist__photo" />
                <Index initial={a.initial} suit={a.suit} flip />
              </span>
              <span className="artist__name">{a.name}</span>
              <span className="artist__country">{a.country}</span>
            </button>
          </li>
        ))}
      </ul>

      <div id="artist-panel" ref={panel} className="artist-panel" hidden={!current} aria-live="polite">
        {current && link && link.h > 0 && (
          <span className="artist-panel__link" aria-hidden="true" style={{ left: link.x, height: link.h }} />
        )}
        {current && (
          <article className="artist-panel__inner" key={current.name}>
            <Photo src={current.photo} alt={current.name} label={labels.photo} sizes="(min-width: 700px) 280px, 60vw" className="artist-panel__photo" />
            <div className="artist-panel__text">
              <p className="artist-panel__country">
                <SuitMark suit={current.suit} /> {current.country}
              </p>
              <h3 className="artist-panel__name">{current.name}</h3>
              {current.bio ? (
                current.bio.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="artist-panel__soon">{labels.bioSoon}</p>
              )}
            </div>
            <button type="button" className="artist-panel__close" onClick={() => setOpen(null)} aria-label={labels.close}>
              ×
            </button>
          </article>
        )}
      </div>
    </>
  );
}
