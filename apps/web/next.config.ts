import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(appDir, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
  experimental: {
    // Owner profile uploads: logo 5MB, cover/gallery 10MB, brochure 20MB.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  transpilePackages: [
    "@eduatlas/application",
    "@eduatlas/config",
    "@eduatlas/domain",
    "@eduatlas/firebase",
    "@eduatlas/types",
    "@eduatlas/ui",
    "@eduatlas/utils",
    "@eduatlas/validation",
  ],
};

export default nextConfig;
