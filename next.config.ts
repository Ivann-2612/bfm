import type { NextConfig } from "next";

// English (DEFAULT_LANG in src/lib/content.ts) is served at "/" (internally /en); Serbian at /sr.
// /en and /en/... redirect to the prefix-less URLs, so there is one address per page.
const nextConfig: NextConfig = {
  poweredByHeader: false,
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

export default nextConfig;
