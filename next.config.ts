import type { NextConfig } from "next";

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
