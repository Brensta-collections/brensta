import { cn } from "@/lib/utils";

/**
 * Illustration-only hero artwork for BRENSTA.
 * Deliberately abstract — no claim to being a real photograph.
 * The owner should drop in a licensed photo via /admin/banners when ready.
 */
export function HeroArtwork({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} aria-hidden="true">
      <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="hero-bg" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#F7E9D3" />
            <stop offset="60%" stopColor="#E7D6C3" />
            <stop offset="100%" stopColor="#D4AF7C" />
          </linearGradient>
          <radialGradient id="hero-sun" cx="0.72" cy="0.28" r="0.35">
            <stop offset="0%" stopColor="#FFF4DD" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF4DD" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-silhouette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F2518" />
            <stop offset="100%" stopColor="#4A3A2A" />
          </linearGradient>
        </defs>

        <rect width="800" height="1000" fill="url(#hero-bg)" />
        <rect width="800" height="1000" fill="url(#hero-sun)" />

        {/* Decorative botanical arcs */}
        <g stroke="#B5915E" strokeOpacity="0.25" strokeWidth="1.5" fill="none">
          <path d="M80 920 Q 200 760 160 560 Q 120 360 240 220" />
          <path d="M620 980 Q 540 760 620 540 Q 700 320 580 180" />
        </g>

        {/* Abstract silhouette suggesting fashion — not a photograph */}
        <g transform="translate(400,560)" fill="url(#hero-silhouette)">
          {/* head */}
          <circle cx="0" cy="-280" r="60" />
          {/* neck */}
          <path d="M-14 -220 L14 -220 L18 -180 L-18 -180 Z" />
          {/* shoulders + torso */}
          <path d="M-150 -170 Q -60 -195 60 -195 Q 150 -170 160 -40 Q 110 60 60 90 L -60 90 Q -110 60 -160 -40 Z" />
          {/* skirt */}
          <path d="M-120 80 Q -140 220 -200 360 L 200 360 Q 140 220 120 80 Z" />
        </g>

        {/* Jewellery accent — pendant */}
        <g transform="translate(400,340)">
          <circle cx="0" cy="0" r="6" fill="#D4AF7C" />
          <path d="M-2 6 L 2 6 L 1 40 L -1 40 Z" fill="#D4AF7C" opacity="0.9" />
          <circle cx="0" cy="46" r="10" fill="#FFF4DD" stroke="#D4AF7C" strokeWidth="1.5" />
        </g>

        {/* Floating category hints */}
        <g fontFamily="Playfair Display, Georgia, serif" fill="#4A3A2A" opacity="0.5">
          <text x="90" y="150" fontSize="22" letterSpacing="4">JEWELLERY</text>
          <text x="560" y="200" fontSize="22" letterSpacing="4">CLOTHING</text>
          <text x="80" y="860" fontSize="22" letterSpacing="4">BAGS</text>
          <text x="540" y="880" fontSize="22" letterSpacing="4">FOOTWEAR</text>
        </g>

        {/* Illustration badge */}
        <g transform="translate(32,960)">
          <rect x="0" y="-20" width="110" height="24" rx="12" fill="#1F1F1F" opacity="0.75" />
          <text x="12" y="-4" fill="#FDF8F1" fontSize="10" fontFamily="Inter, sans-serif" letterSpacing="2">ILLUSTRATION</text>
        </g>
      </svg>
    </div>
  );
}
