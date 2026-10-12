"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getContent } from "@/lib/content";
import type { LangProps } from "./ui";

type Choice = "granted" | "denied" | null;
const KEY = "analytics-consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function CookieBanner({ lang }: LangProps) {
  // undefined = not read yet; rendering nothing until mount avoids a hydration mismatch.
  const [choice, setChoice] = useState<Choice | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    setChoice(saved === "granted" || saved === "denied" ? saved : null);
  }, []);

  function decide(c: "granted" | "denied") {
    localStorage.setItem(KEY, c);
    setChoice(c);
  }

  if (choice === undefined || !GA_ID) return null;

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
  return (
    <div className="cookie" role="region" aria-label="Analytics consent">
      <p>{c.text}</p>
      <div className="cookie__actions">
        <button type="button" className="btn btn--small" onClick={() => decide("granted")}>
          {c.accept}
        </button>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => decide("denied")}>
          {c.decline}
        </button>
      </div>
    </div>
  );
}
