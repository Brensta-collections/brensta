import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// The root title template is "%s | BRENSTA" — so a bare "About" renders as
// "About | BRENSTA" without doubling the brand name.
export const metadata: Metadata = {
  title: "About",
  description: "BRENSTA — hand-picked women's jewellery, shipped from Pune.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "About" }]} />
      <section className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">About BRENSTA</p>
        <h1 className="brand-wordmark mt-3 text-4xl text-charcoal md:text-5xl">For Every You</h1>
        <p className="mt-5 text-sm leading-relaxed text-charcoal/80">
          BRENSTA brings together refined craftsmanship and contemporary design in women&apos;s jewellery —
          starting with jhumkas handpicked for everyday elegance and festive moments alike. More
          collections are on the way.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
          Every piece is sourced carefully, photographed in natural light, and shipped from Pune — so your order
          feels personal, from the first click to the moment it arrives at your door.
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-line pt-6 text-center">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Based in</dt>
            <dd className="brand-wordmark mt-1 text-lg text-gold-deep">Pune, India</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Craft</dt>
            <dd className="brand-wordmark mt-1 text-lg text-gold-deep">Handpicked</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">For</dt>
            <dd className="brand-wordmark mt-1 text-lg text-gold-deep">Every You</dd>
          </div>
        </dl>
      </section>

      <section className="mt-16 rounded-2xl border border-brand-line bg-white p-8">
        <h2 className="brand-wordmark text-2xl text-charcoal">What we stand for</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Craft</p>
            <p className="mt-1 text-sm text-charcoal/80">We pick partners who take pride in detail — hand-set stones, considered stitching, finishes that last.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Versatility</p>
            <p className="mt-1 text-sm text-charcoal/80">Pieces that work hard across occasions — from a Monday meeting to a festival evening.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Care</p>
            <p className="mt-1 text-sm text-charcoal/80">Honest descriptions, fair pricing and support you can actually reach.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
