"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Attr = {
  code: string;
  name: string;
  type: string;
  options: string[];
  activeValues: string[];
};

export function FilterSidebar({
  attributes,
  minPrice,
  maxPrice,
}: {
  attributes: Attr[];
  minPrice?: string;
  maxPrice?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function updateParam(key: string, value: string | string[]) {
    const next = new URLSearchParams(params);
    next.delete(key);
    if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
    else if (value) next.set(key, value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleAttr(code: string, option: string, checked: boolean) {
    const current = params.getAll(`a_${code}`);
    const nextValues = checked ? [...current, option] : current.filter((v) => v !== option);
    updateParam(`a_${code}`, nextValues);
  }

  return (
    <aside className="space-y-6 text-sm">
      {/* Price */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Price (₹)</h3>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const data = new FormData(form);
            const next = new URLSearchParams(params);
            const mn = String(data.get("min") ?? "");
            const mx = String(data.get("max") ?? "");
            if (mn) next.set("min", mn); else next.delete("min");
            if (mx) next.set("max", mx); else next.delete("max");
            next.delete("page");
            router.push(`${pathname}?${next.toString()}`);
          }}
        >
          <input name="min" defaultValue={minPrice ?? ""} placeholder="Min" inputMode="numeric" className="w-20 rounded border border-brand-line bg-white px-2 py-1" />
          <span className="text-brand-muted">—</span>
          <input name="max" defaultValue={maxPrice ?? ""} placeholder="Max" inputMode="numeric" className="w-20 rounded border border-brand-line bg-white px-2 py-1" />
          <button type="submit" className="rounded-full bg-charcoal px-3 py-1.5 text-xs text-ivory">Apply</button>
        </form>
      </section>

      {/* Attributes */}
      {attributes.map((a) => (
        <section key={a.code}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">{a.name}</h3>
          <ul className="mt-3 space-y-1.5">
            {a.options.map((opt) => {
              const checked = a.activeValues.includes(opt);
              return (
                <li key={opt}>
                  <label className="flex cursor-pointer items-center gap-2 text-charcoal">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleAttr(a.code, opt, e.target.checked)}
                      className="h-4 w-4 rounded border-brand-line text-gold-deep focus:ring-gold"
                    />
                    <span>{opt}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <button
        type="button"
        onClick={() => router.push(pathname)}
        className="text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-charcoal"
      >
        Clear all filters
      </button>
    </aside>
  );
}
