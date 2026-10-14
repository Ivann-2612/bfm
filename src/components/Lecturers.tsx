"use client";

import { useState } from "react";
import { site } from "@/lib/content";
import { Photo, SectionHead, type LangProps } from "./ui";

export function Lecturers({ lang }: LangProps) {
  const [flipped, setFlipped] = useState<number | null>(null);
  const { c, lecturers } = site(lang);
  if (lecturers.length === 0) return null;
  const { ui } = c;

  return (
    <section id="predavaci" className="section lecturers" aria-labelledby="lecturers-title">
      <div className="wrap">
        <SectionHead id="lecturers-title" kicker={c.lecturers.kicker} title={c.lecturers.title} />
        <ul className="lecturers__grid">
          {lecturers.map((l, i) => {
            const isFlipped = flipped === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`pcard ${isFlipped ? "is-flipped" : ""}`}
                  aria-pressed={isFlipped}
                  aria-label={`${l.name}, ${l.specialty}. ${isFlipped ? ui.hideBio : ui.showBio}`}
                  onClick={() => setFlipped(isFlipped ? null : i)}
                >
                  <span className="pcard__inner">
                    <span className="pcard__face pcard__front">
                      <Photo
                        src={l.photo}
                        alt={l.name}
                        label={ui.photoPlaceholder}
                        sizes="(min-width: 640px) 260px, 240px"
                        className="pcard__photo"
                      />
                      <span className="pcard__caption">
                        <span className="pcard__name">{l.name}</span>
                        <span className="pcard__meta">
                          {l.specialty} · {l.country}
                        </span>
                      </span>
                    </span>
                    <span className="pcard__face pcard__back">
                      <span className="pcard__name">{l.name}</span>
                      <span className="pcard__bio">{l.bio}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {/* Phones: a plain list with the text visible, instead of a sideways strip of cards to flip. */}
        <ul className="lecturers__list">
          {lecturers.map((l, i) => (
            <li key={i}>
              <Photo src={l.photo} alt={l.name} label={ui.photoPlaceholder} sizes="7rem" className="lecturers__thumb" />
              <div>
                <h3 className="lecturers__name">{l.name}</h3>
                <p className="lecturers__meta">
                  {l.specialty} · {l.country}
                </p>
                <p className="lecturers__bio">{l.bio}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
