import type { Metadata } from "next";
import { fontVars } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Prijave — organizator",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminLinksLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
