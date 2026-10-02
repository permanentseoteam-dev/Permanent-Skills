import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
    proxyClientMaxBodySize: "80mb",
  },
};

export default nextConfig;
