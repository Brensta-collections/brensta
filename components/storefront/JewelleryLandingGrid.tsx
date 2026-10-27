import Link from "next/link";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

type Child = {
  id: string;
  name: string;
  path: string;
  image?: string | null;
  hasProductsInSubtree?: boolean;
};

type Props = {
  categoryName: string;
  categoryDescription?: string | null;
  childCategories: Child[];
  totalProducts: number;
};

// First four slugs render as large hero cards; the rest fall into a compact
// grid below. Pick these to match owner priorities for the jewellery page.
const HERO_SLUGS = ["earrings", "necklaces", "rings", "bangles"] as const;

/**
 * Specialised landing-page view for /c/jewellery. Replaces the generic chip
 * row because with 16 top-level jewellery types the chip wrap gets too tall
 * and loses visual hierarchy. All other category pages continue to use the
 * default chip row.
 */
export function JewelleryLandingGrid({
  categoryName,
  categoryDescription,
  childCategories,
  totalProducts,
}: Props) {
  // Only surface subcategories that actually have products — otherwise
  // customers click a hero tile and land on an empty "coming soon" page,
  // which signals the shop is broken. Admin still sees empties via
  // /admin/categories and can un-hide the hero cards here by uploading
  // products to those subcategories.
  const liveChildren = childCategories.filter((c) => c.hasProductsInSubtree);

  // Split into hero (top 4 by convention) + the rest.
  const hero: Child[] = [];
  const rest: Child[] = [];
  const byPath = new Map(liveChildren.map((c) => [c.path, c] as const));
  for (const slug of HERO_SLUGS) {
    const path = `/jewellery/${slug}`;
    const found = byPath.get(path);
    if (found) hero.push(found);
  }
  const heroPaths = new Set(hero.map((h) => h.path));
  for (const c of liveChildren) {
    if (!heroPaths.has(c.path)) rest.push(c);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">{categoryName}</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {totalProducts} product{totalProducts === 1 ? "" : "s"}
            {categoryDescription ? ` · ${categoryDescription}` : ""}
          </p>
        </div>
      </div>

      {/* Hero cards (up to 4) */}
      {hero.length > 0 && (
        <section className="mt-8" aria-label="Featured jewellery categories">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {hero.map((c) => (
              <Link
                key={c.id}
                href={`/c${c.path}`}
                className="group relative overflow-hidden rounded-2xl border border-brand-line bg-ivory"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                  ) : (
                    <PlaceholderImage seed={`cat-${c.path}`} label={c.name} aspect="portrait" />
                  )}
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="brand-wordmark text-base text-charcoal md:text-lg">{c.name}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold-deep">
                    Shop {c.name} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Rest of the jewellery types — compact grid of 12 */}
      {rest.length > 0 && (
        <section className="mt-10" aria-label="All jewellery categories">
          <h2 className="brand-wordmark text-2xl text-charcoal">Explore all jewellery</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {rest.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/c${c.path}`}
                  className="flex items-center justify-between rounded-lg border border-brand-line bg-white px-4 py-3 text-sm text-charcoal transition hover:border-gold hover:text-gold-deep"
                >
                  <span className="font-medium">{c.name}</span>
                  <span aria-hidden="true" className="text-brand-muted group-hover:text-gold-deep">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
