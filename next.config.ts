import type { NextConfig } from "next";
import { browser } from "react-dom";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // cacheComponents: true,
  // partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: {
      fs: {
        browser: "./lib/empty-module.ts"
      }
    }
  },
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
