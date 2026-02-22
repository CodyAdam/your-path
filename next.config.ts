import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "owgwxm9whab49wkr.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
