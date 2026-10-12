import type { Metadata } from "next";
import { fontVars } from "../fonts";
import "../globals.css";

// Separate root layout for the organiser's page (the public site's root layout lives under [lang]).
export const metadata: Metadata = {
  title: "Karte — prijave",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
