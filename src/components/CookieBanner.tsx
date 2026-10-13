"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getContent, privacyPath } from "@/lib/content";
import type { LangProps } from "./ui";

type Choice = "granted" | "denied" | null;
const KEY = "analytics-consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Shatter: the banner is cut into a COLS x ROWS grid; each piece flies away from the centre.
const COLS = 6;
const ROWS = 4;
const SHATTER_MS = 1000;

type Rect = { left: number; top: number; width: number; height: number };

export function CookieBanner({ lang }: LangProps) {
  // undefined = not read yet; rendering nothing until mount avoids a hydration mismatch.
  const [choice, setChoice] = useState<Choice | undefined>(undefined);
  // Local preview only (npm run dev): add ?cookies to the URL to always show the banner,
  // even without a GA ID or after a choice was saved. Nothing is stored in this mode.
  const [preview, setPreview] = useState(false);
  // Banner position at the moment of the click, while the pieces fly.
  const [shatter, setShatter] = useState<Rect | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isPreview = process.env.NODE_ENV === "development" && new URLSearchParams(location.search).has("cookies");
    setPreview(isPreview);
    const saved = isPreview ? null : localStorage.getItem(KEY);
    setChoice(saved === "granted" || saved === "denied" ? saved : null);
  }, []);

  // While the banner is open, other bottom-fixed bits (phone Register button, total bar) step aside.
  const open = choice === null && (Boolean(GA_ID) || preview);
  useEffect(() => {
    document.documentElement.classList.toggle("cookie-open", open);
    return () => document.documentElement.classList.remove("cookie-open");
  }, [open]);

  function decide(c: "granted" | "denied") {
    if (shatter) return;
    if (!preview) localStorage.setItem(KEY, c);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = box.current?.getBoundingClientRect();
    if (reduce || !r) return setChoice(c);
    setShatter({ left: r.left, top: r.top, width: r.width, height: r.height });
    window.setTimeout(() => {
      setChoice(c);
      setShatter(null);
    }, SHATTER_MS);
  }

  if (choice === undefined || (!GA_ID && !preview)) return null;
  if (preview && choice !== null) return null;

  if (choice === "granted") {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
        </Script>
      </>
    );
  }
  if (choice === "denied") return null;

  const c = getContent(lang).cookies;
  const content = (interactive: boolean) => (
    <>
      <p className="cookie__title">{c.title}</p>
      <p>
        {c.text} <a href={privacyPath(lang)} tabIndex={interactive ? undefined : -1}>{c.more}</a>
      </p>
      {/* Same style for both buttons: refusing must be as easy as accepting. */}
      <div className="cookie__actions">
        <button type="button" className="btn btn--small" tabIndex={interactive ? undefined : -1} onClick={interactive ? () => decide("granted") : undefined}>
          {c.accept}
        </button>
        <button type="button" className="btn btn--small" tabIndex={interactive ? undefined : -1} onClick={interactive ? () => decide("denied") : undefined}>
          {c.decline}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div ref={box} className="cookie" role="region" aria-label={c.label} style={shatter ? { visibility: "hidden" } : undefined}>
        {content(true)}
      </div>

      {shatter && (
        // Each piece is a window onto a static copy of the banner, offset to show its own slice.
        <div className="shatter" style={{ left: shatter.left, top: shatter.top, width: shatter.width, height: shatter.height }} aria-hidden="true">
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const w = shatter.width / COLS;
            const h = shatter.height / ROWS;
            const x = col * w;
            const y = row * h;
            // Direction from the banner centre, plus a little gravity; small fixed jitter per piece.
            const dx = x + w / 2 - shatter.width / 2;
            const dy = y + h / 2 - shatter.height / 2;
            const jitter = ((i * 37) % 11) - 5;
            const style = {
              left: x,
              top: y,
              width: w + 0.5,
              height: h + 0.5,
              "--tx": `${dx * 1.6 + jitter * 6}px`,
              "--ty": `${dy * 1.8 + 140 + Math.abs(jitter) * 12}px`,
              "--rot": `${(dx > 0 ? 1 : -1) * (25 + Math.abs(jitter) * 9)}deg`,
              animationDelay: `${Math.round(Math.hypot(dx, dy) / 6)}ms`,
            } as React.CSSProperties;
            return (
              <div key={i} className="shatter__piece" style={style}>
                <div className="cookie cookie--slice" style={{ left: -x, top: -y, width: shatter.width, height: shatter.height }}>
                  {content(false)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
