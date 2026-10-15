import type { NextConfig } from "next";

// Static export for AdriaHost: plain files in out/.
// The public .htaccess handles the old /en and /privacy URL patterns.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.1.12", "localhost", "127.0.0.1"],
};

export default nextConfig;
