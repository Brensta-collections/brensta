import type { NextConfig } from "next";

// Baseline security headers applied to every response.
// NOT included here (deliberately, until a CSP policy that passes manual QA
// against the live site is written): Content-Security-Policy. A broken CSP
// breaks the storefront silently; add it as a follow-up with report-only
// first, then enforce.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HSTS: only emit in production. Browsers ignore it on http:// so this
  // is defensive, not strictly needed, but keeping it conditional avoids
  // the preload flag ever ending up on a staging host that drops to HTTP.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  // Ecommerce pages are data-driven; opt out of Next 16 cacheComponents for M2.
  // We'll re-enable with explicit `"use cache"` directives + revalidate tags in M3+.
  cacheComponents: false,
  partialPrefetching: false,
  // Cloudflare R2 serves user-uploaded images from pub-*.r2.dev. Allow those
  // hostnames so <Image/> optimization accepts them. Hobby plan has limited
  // image optimization quota — a plain <img src> also works and skips it.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS as unknown as { key: string; value: string }[] },
    ];
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
