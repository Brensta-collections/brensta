import type { Metadata } from "next";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

// The root title template is "%s | BRENSTA" — so a bare "About" renders as
// "About | BRENSTA" without doubling the brand name.
export const metadata: Metadata = {
  title: "About",
  description: "BRENSTA — a premium women's fashion and lifestyle store. Jewellery, clothing, bags, accessories and footwear curated for everyday elegance.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "About" }]} />
      <section className="mt-6 grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">About BRENSTA</p>
          <h1 className="brand-wordmark mt-3 text-4xl text-charcoal md:text-5xl">For Every You</h1>
          <p className="mt-5 text-sm leading-relaxed text-charcoal/80">
            BRENSTA is a premium women&apos;s fashion and lifestyle store. We bring together refined craftsmanship and
            contemporary design across jewellery, clothing, bags, accessories and footwear — thoughtfully curated so that
            every piece feels considered, versatile and quietly beautiful.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
            This is a BRENSTA development build. Our catalogue is being prepared and demo products are clearly labelled
            while we finalise suppliers, photography and policies with the owner.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-line pt-6 text-center">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Based in</dt>
              <dd className="brand-wordmark mt-1 text-lg text-gold-deep">India</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Categories</dt>
              <dd className="brand-wordmark mt-1 text-lg text-gold-deep">5+</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">For</dt>
              <dd className="brand-wordmark mt-1 text-lg text-gold-deep">Every You</dd>
            </div>
          </dl>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <PlaceholderImage seed="about-brensta" label="BRENSTA" aspect="portrait" className="h-full min-h-[320px]" />
        </div>
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
