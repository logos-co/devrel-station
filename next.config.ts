import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // X media thumbnails shown on Content Factory preview tiles
    remotePatterns: [{ protocol: "https", hostname: "pbs.twimg.com" }],
  },
  async redirects() {
    // Pre-rebrand URLs (RFP tracker era) — keep old shared links working
    return [
      { source: "/rfp/:slug", destination: "/rfps/:slug", permanent: true },
      { source: "/pipeline", destination: "/rfps", permanent: true },
    ];
  },
};

export default nextConfig;
