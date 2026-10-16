import { Bodoni_Moda, Cinzel, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

export const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
export const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });
export const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const poster = Cinzel({ subsets: ["latin", "latin-ext"], weight: ["600"], variable: "--font-poster", display: "swap", preload: false });

export const fontVars = `${display.variable} ${body.variable} ${mono.variable} ${poster.variable}`;
