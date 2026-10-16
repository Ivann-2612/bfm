"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Artist, Suit } from "@/lib/content";
import { Flag, Photo, SuitMark } from "./ui";

export type ArtistCard = Artist & { suit: Suit; initial: string };
type Labels = { photo: string; bioSoon: string; close: string; about: string };

function Index({ initial, suit, flip = false }: { initial: string; suit: Suit; flip?: boolean }) {
  return (
    <span className={`artist__index ${flip ? "artist__index--flip" : ""}`} aria-hidden="true">
      <span>{initial}</span>
      <SuitMark suit={suit} />
    </span>
  );
}

export function GalaArtistsGrid({ artists, labels }: { artists: ArtistCard[]; labels: Labels }) {
  const [open, setOpen] = useState<number | null>(null);
  const clicked = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [link, setLink] = useState<{ x: number; h: number } | null>(null);
  const current = open === null ? null : artists[open];

  useLayoutEffect(() => {
    function measure() {
      const li = open === null ? null : items.current[open];
      if (!li || !panel.current) return setLink(null);
      const p = panel.current.getBoundingClientRect();
      const r = li.getBoundingClientRect();
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
              <span className="artist__country">
                <Flag code={a.code} />
                {a.country}
              </span>
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
                <SuitMark suit={current.suit} /> <Flag code={current.code} />
                {current.country}
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
