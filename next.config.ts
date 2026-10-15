import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// The site is a static export (`next build` → out/) served by AdriaHost; the server parts are
// Supabase functions (supabase/functions). English (DEFAULT_LANG) is built as /en/ and shown at
// "/", Serbian at /sr/: on AdriaHost that routing is done by public/.htaccess, and here in
// `npm run dev` by the same rewrites/redirects as before.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      async redirects() {
        return [
          { source: "/en", destination: "/", permanent: true },
          { source: "/en/:path*", destination: "/:path*", permanent: true },
        ];
      },
      async rewrites() {
        return [
          { source: "/", destination: "/en" },
          { source: "/privacy", destination: "/en/privacy" },
        ];
      },
    };
  }
  return {
    output: "export",
    trailingSlash: true, // /sr/ → out/sr/index.html, which LiteSpeed serves as is
    images: { unoptimized: true }, // no image server; the photos are resized beforehand
  };
}
