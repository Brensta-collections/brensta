import Link from "next/link";

export function Pagination({ pathname, searchParams, page, pages }: { pathname: string; searchParams: Record<string, string | string[] | undefined>; page: number; pages: number }) {
  if (pages <= 1) return null;
  const build = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (!v || k === "page") continue;
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
      else sp.set(k, v);
    }
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 text-sm">
      {page > 1 && (
        <Link href={build(page - 1)} className="rounded-full border border-brand-line px-3 py-1.5 text-charcoal hover:border-gold">Prev</Link>
      )}
      <span className="rounded-full bg-charcoal px-4 py-1.5 text-ivory">{page} / {pages}</span>
      {page < pages && (
        <Link href={build(page + 1)} className="rounded-full border border-brand-line px-3 py-1.5 text-charcoal hover:border-gold">Next</Link>
      )}
    </nav>
  );
}
