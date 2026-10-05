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
  generateBuildId: async () => {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      process.env.BUILD_ID ||
      null
    );
  },
};

export default nextConfig;
