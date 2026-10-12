import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bodoni_Moda, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { LANGS, getContent, homePath, isLang } from "@/lib/content";
import { CookieBanner } from "@/components/CookieBanner";
import "../globals.css";

const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const c = getContent(lang);
  return {
    title: c.site.title,
    description: c.site.description,
    alternates: {
      canonical: homePath(lang),
      languages: Object.fromEntries(LANGS.map((l) => [getContent(l).site.lang, homePath(l)])),
    },
  };
}

export const viewport: Viewport = { themeColor: "#0D0B0A" };

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={getContent(lang).site.lang} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {children}
        <CookieBanner lang={lang} />
      </body>
    </html>
  );
}
