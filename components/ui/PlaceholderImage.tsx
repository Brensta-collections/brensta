/**
 * Branded SVG placeholder for demo products.
 * Deterministic per seed, so a product's placeholder is stable across renders.
 * In M5 admins upload real product images that replace this entirely.
 */
import { cn } from "@/lib/utils";

type Props = {
  seed: string;
  label?: string;
  className?: string;
  aspect?: "square" | "portrait";
};

const PALETTES: Array<[string, string, string]> = [
  ["#FDF8F1", "#E7D6C3", "#B5915E"],
  ["#FBF2E6", "#D4AF7C", "#8B5E3C"],
  ["#F5EBD9", "#C9A77A", "#4A3A2A"],
  ["#F7E9D3", "#B38B5E", "#2F2518"],
  ["#EFE2CF", "#AF8E63", "#5B4530"],
  ["#F3E8D4", "#C3A078", "#3D2E1F"],
  ["#F8EEDC", "#D5B384", "#7A5B3B"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function PlaceholderImage({ seed, label, className, aspect = "square" }: Props) {
  const [bg, mid, fg] = PALETTES[hash(seed) % PALETTES.length];
  const initials = (label ?? seed)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const gradientId = `g-${hash(seed)}`;
  const w = 600;
  const h = aspect === "square" ? 600 : 800;

  return (
    <div className={cn("relative w-full overflow-hidden", aspect === "square" ? "aspect-square" : "aspect-[3/4]", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bg} />
            <stop offset="60%" stopColor={mid} />
            <stop offset="100%" stopColor={bg} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${gradientId})`} />
        <circle cx={w * 0.78} cy={h * 0.22} r={w * 0.18} fill={fg} opacity={0.08} />
        <circle cx={w * 0.22} cy={h * 0.78} r={w * 0.22} fill={fg} opacity={0.06} />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={fg}
          fontFamily="Playfair Display, Georgia, serif"
          fontSize={w * 0.22}
          fontWeight="500"
          letterSpacing={w * 0.01}
          opacity={0.6}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
