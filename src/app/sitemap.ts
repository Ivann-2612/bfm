import type { MetadataRoute } from "next";
import { LANGS, getContent, homePath, privacyPath, type Lang } from "@/lib/content";

export const dynamic = "force-static";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belgrademagicfestival.rs").replace(/\/+$/, "");
const url = (path: string) => `${SITE_URL}${path.endsWith("/") ? path : `${path}/`}`;

function entries(path: (lang: Lang) => string, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANGS.map((l) => [getContent(l).site.lang, url(path(l))]));
  return LANGS.map((lang) => ({ url: url(path(lang)), priority, alternates: { languages } }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...entries(homePath, 1), ...entries(privacyPath, 0.2)];
}
