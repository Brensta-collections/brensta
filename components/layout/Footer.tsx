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

const INSTAGRAM_URL = "https://www.instagram.com/brensta.in";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61595757759049";

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
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow BRENSTA on Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-charcoal transition hover:border-gold hover:bg-gold hover:text-ivory"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow BRENSTA on Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-white text-charcoal transition hover:border-gold hover:bg-gold hover:text-ivory"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
              <p className="text-xs text-brand-muted">
                Follow us on{" "}
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-gold-deep">Instagram</a>
                {" "}and{" "}
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-gold-deep">Facebook</a>
                .
              </p>
            </div>
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
