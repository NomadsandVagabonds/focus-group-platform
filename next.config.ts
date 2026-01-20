import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force webpack instead of Turbopack
  bundlePagesRouterDependencies: true,
  experimental: {
    // Empty to avoid Turbopack
  },
};

export default nextConfig;
