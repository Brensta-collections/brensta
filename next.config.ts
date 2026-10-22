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
  async redirects() {
    return [
      // Jhumka moves from a top-level jewellery sibling to a child of
      // Earrings. Permanent 301 so any existing links / search-index entries
      // / bookmarks keep working. The redirect runs at the Next.js routing
      // layer before the page handler, so it does not depend on the DB row
      // for /jewellery/jhumkas still existing.
      {
        source: "/c/jewellery/jhumkas",
        destination: "/c/jewellery/earrings/jhumka",
        permanent: true,
      },
      {
        source: "/c/jewellery/jhumkas/:slug*",
        destination: "/c/jewellery/earrings/jhumka/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
