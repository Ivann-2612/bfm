import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belgrademagicfestival.rs").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/karte/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
