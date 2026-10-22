import { Search } from "lucide-react";

/**
 * Server-rendered search form on /search itself. Needed because the header's
 * full search field is only visible at >=lg; below that breakpoint the header
 * magnifier navigates to /search with no query parameter and visitors had no
 * way to type anything. A plain HTML GET form works without JavaScript and
 * degrades gracefully.
 */
export function SearchForm({ defaultQ, className }: { defaultQ: string; className?: string }) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      <label htmlFor="search-q" className="sr-only">
        Search products
      </label>
      <div className="flex h-11 w-full items-center gap-2 rounded-full border border-brand-line bg-white pl-4 pr-1.5 text-sm text-charcoal focus-within:border-gold">
        <Search className="h-4 w-4 shrink-0 text-brand-muted" aria-hidden="true" />
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={defaultQ}
          placeholder="Try jewellery, saree, tote, sunglasses…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-brand-muted/70"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-charcoal px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-charcoal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Search
        </button>
      </div>
    </form>
  );
}
