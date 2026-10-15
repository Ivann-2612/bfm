"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SuitMark } from "./ui";
import type { Suit } from "@/lib/content";

// Time left until the festival opens, as four small cards (days ♠, hours ♥, minutes ♣, seconds ♦).
// Computed only in the browser (the server can't know "now" for the visitor: no hydration
// mismatch); until then the cards show dashes.
// On desktop, once the hero's countdown scrolls away, a small plaque with the same numbers
// drops in under the navigation, hanging from it on two cords, and swings into place.
const SUITS: Suit[] = ["spades", "hearts", "clubs", "diamonds"];

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export function Countdown({
  startsAt,
  label,
  when,
  units,
  done,
}: {
  startsAt: string;
  label: string;
  when: string;
  units: string[];
  done: string;
}) {
  const target = Date.parse(startsAt);
  const [left, setLeft] = useState<number | null>(null);
  const [hanging, setHanging] = useState(false);
  const own = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Hang under the header only after the hero countdown has scrolled up out of view
  // (not while it is still below the fold).
  useEffect(() => {
    const el = own.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setHanging(!e.isIntersecting && e.boundingClientRect.top < 80),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (left !== null && left <= 0) {
    return <p className="countdown countdown--done">{done}</p>;
  }
  const values = left === null ? null : parts(left);
  const text = (i: number) => (values ? String(values[i]).padStart(i === 0 ? 1 : 2, "0") : "––");

  return (
    <div ref={own} className="countdown">
      <p className="countdown__label">
        {label} <span>· {when}</span>
      </p>
      <ol className="countdown__cards" aria-hidden="true">
        {units.map((unit, i) => (
          <li key={unit} className="countdown__card">
            <SuitMark suit={SUITS[i]} className="countdown__suit" />
            {/* A new key per value replays the small slide-in when the number changes. */}
            <b key={text(i)} className="countdown__num">
              {text(i)}
            </b>
            <span className="countdown__unit">{unit}</span>
          </li>
        ))}
      </ol>
      {values && (
        <p className="visually-hidden">
          {label}: {units.map((u, i) => `${values[i]} ${u}`).join(", ")}
        </p>
      )}
      {values &&
        createPortal(
          <div className={`countdown-hang ${hanging ? "is-shown" : ""}`} aria-hidden="true">
            <span className="countdown-hang__cord countdown-hang__cord--l" />
            <span className="countdown-hang__cord countdown-hang__cord--r" />
            <div className="countdown-hang__plaque">
              {units.map((unit, i) => (
                <span key={unit} className="countdown-hang__cell">
                  <SuitMark suit={SUITS[i]} className="countdown-hang__suit" />
                  <b>{text(i)}</b>
                  <small>{unit}</small>
                </span>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
