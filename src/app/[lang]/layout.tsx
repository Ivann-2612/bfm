import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LANG, LANGS, getContent, homePath, isLang } from "@/lib/content";
import { CookieBanner } from "@/components/CookieBanner";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fontVars } from "../fonts";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

/** Public address of the site: NEXT_PUBLIC_SITE_URL once there is a custom domain, else the Vercel production URL. */
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const c = getContent(lang);
  // Link previews (WhatsApp, Viber, Facebook…) need absolute URLs. Images: public/og-<lang>.png,
  // regenerated with scripts/make-og.ps1 when the name or dates change.
  const image = { url: `/og-${lang}.png`, width: 1200, height: 630, alt: c.site.title };
  return {
    metadataBase: new URL(siteUrl()),
    title: c.site.title,
    description: c.site.description,
    openGraph: {
      type: "website",
      siteName: c.event.name,
      title: c.site.title,
      description: c.site.description,
      url: homePath(lang),
      locale: c.site.locale.replace(/-Latn/, "").replace("-", "_"),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: c.site.title, description: c.site.description, images: [image.url] },
    alternates: {
      canonical: homePath(lang),
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [getContent(l).site.lang, homePath(l)])),
        "x-default": homePath(DEFAULT_LANG),
      },
    },
  };
}

export const viewport: Viewport = { themeColor: "#0C0B0E" };

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
