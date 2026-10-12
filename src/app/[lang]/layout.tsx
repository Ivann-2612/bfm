import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { LANGS, getContent, homePath, isLang } from "@/lib/content";
import { CookieBanner } from "@/components/CookieBanner";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fontVars } from "../fonts";
import "../globals.css";

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
    <html lang={getContent(lang).site.lang} className={fontVars}>
      <body>
        {children}
        <CookieBanner lang={lang} />
        <ScrollReveal />
      </body>
    </html>
  );
}
