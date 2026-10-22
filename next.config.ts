import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ecommerce pages are data-driven; opt out of Next 16 cacheComponents for M2.
  // We'll re-enable with explicit `"use cache"` directives + revalidate tags in M3+.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
