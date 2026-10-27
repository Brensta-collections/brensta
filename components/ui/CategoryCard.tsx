import Link from "next/link";
import { PlaceholderImage } from "./PlaceholderImage";

export function CategoryCard({ name, path, subCount, image }: { name: string; path: string; subCount: number; image?: string | null }) {
  return (
    <Link href={`/c${path}`} className="group block overflow-hidden rounded-xl border border-brand-line bg-white transition hover:border-gold hover:shadow-sm">
      <div className="relative">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <PlaceholderImage seed={`cat-${path}`} label={name} aspect="square" />
        )}
      </div>
      <div className="p-4 text-center">
        <h3 className="brand-wordmark text-lg text-charcoal group-hover:text-gold-deep">{name}</h3>
        <p className="mt-1 text-xs text-brand-muted">
          {subCount > 0 ? `${subCount} ${subCount === 1 ? "subcategory" : "subcategories"}` : "Explore"}
        </p>
      </div>
    </Link>
  );
}
