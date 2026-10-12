import type { NextConfig } from "next";

// Serbian is served at "/" (internally /sr); English at /en.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/sr", destination: "/", permanent: true },
      { source: "/sr/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/sr" },
      { source: "/privacy", destination: "/sr/privacy" },
    ];
  },
};

export default nextConfig;
