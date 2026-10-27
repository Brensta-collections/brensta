import Link from "next/link";
import { getMainCategoriesWithChildren } from "@/lib/categories";
import { Logo } from "./Logo";
import {
  LEGAL_ENTITY_SHORT,
  LEGAL_ADDRESS,
  GSTIN,
  BUSINESS_EMAIL,
  BUSINESS_PHONE_DISPLAY,
} from "@/lib/business";

export async function Footer() {
  const categories = await getMainCategoriesWithChildren();

  return (
    <footer className="mt-24 border-t border-brand-line bg-ivory">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-sm text-brand-muted">
              A premium women&apos;s fashion and lifestyle destination — jewellery, clothing, bags, accessories and footwear, thoughtfully curated.
            </p>
            <div className="mt-6 space-y-1 text-xs leading-relaxed text-brand-muted">
              <p className="font-semibold text-charcoal">{LEGAL_ENTITY_SHORT}</p>
              <p>{LEGAL_ADDRESS}</p>
              <p>GSTIN: <span className="font-mono text-charcoal">{GSTIN}</span></p>
              <p>Email: <a href={`mailto:${BUSINESS_EMAIL}`} className="hover:text-gold-deep">{BUSINESS_EMAIL}</a></p>
              <p>Phone: {BUSINESS_PHONE_DISPLAY}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/c${c.path}`} className="text-charcoal hover:text-gold-deep">{c.name}</Link>
                </li>
              ))}
              <li><Link href="/shop" className="text-charcoal hover:text-gold-deep">Shop All</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Help</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/p/policies/shipping" className="text-charcoal hover:text-gold-deep">Shipping</Link></li>
              <li><Link href="/p/policies/returns" className="text-charcoal hover:text-gold-deep">Returns</Link></li>
              <li><Link href="/p/policies/faq" className="text-charcoal hover:text-gold-deep">FAQ</Link></li>
              <li><Link href="/contact" className="text-charcoal hover:text-gold-deep">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/p/policies/privacy" className="text-charcoal hover:text-gold-deep">Privacy</Link></li>
              <li><Link href="/p/policies/terms" className="text-charcoal hover:text-gold-deep">Terms</Link></li>
              <li><Link href="/p/policies/cancellation" className="text-charcoal hover:text-gold-deep">Cancellation</Link></li>
              <li><Link href="/p/policies/grievance" className="text-charcoal hover:text-gold-deep">Grievance</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-brand-line pt-6 text-xs text-brand-muted md:flex-row">
          <p>© {new Date().getFullYear()} BRENSTA · All rights reserved.</p>
          <p>Made with care for Indian fashion.</p>
        </div>
      </div>
    </footer>
  );
}
