import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * BRENSTA wordmark. Owner will drop a real logo SVG into /brand/ later;
 * this component falls back to the typographic wordmark until then.
 */
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };
  return (
    <Link href="/" aria-label="BRENSTA home" className={cn("brand-wordmark inline-flex items-center gap-2 font-semibold text-gold-deep", sizes[size], className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold text-base">B</span>
      <span className="tracking-[0.22em]">BRENSTA</span>
    </Link>
  );
}
