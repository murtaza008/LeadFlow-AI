import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> for page changes (old page fades out, new one rises in).
    viewTransition: true,
  },
};

export default nextConfig;
