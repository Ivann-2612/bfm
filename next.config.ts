import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      allowedDevOrigins: ["192.168.1.12", "localhost", "127.0.0.1"],
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
    trailingSlash: true,
    images: { unoptimized: true },
    poweredByHeader: false,
  };
}
