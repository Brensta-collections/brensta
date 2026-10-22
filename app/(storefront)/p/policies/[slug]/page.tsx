import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { POLICY_SLUGS, getPolicy, type PolicySlug } from "@/lib/policies";
import { renderPolicyMarkdown } from "@/lib/markdown";

export async function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(POLICY_SLUGS as readonly string[]).includes(slug)) return { title: "Policy not found" };
  const p = await getPolicy(slug as PolicySlug);
  return {
    title: p.title,
    description: `${p.title} — BRENSTA. Draft content; please verify business-specific details.`,
    alternates: { canonical: `/p/policies/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(POLICY_SLUGS as readonly string[]).includes(slug)) notFound();
  const p = await getPolicy(slug as PolicySlug);
  const html = renderPolicyMarkdown(p.body);

  const related = POLICY_SLUGS.filter((s) => s !== slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "Policies" }, { name: p.title }]} />
      <h1 className="brand-wordmark mt-4 text-3xl text-charcoal md:text-4xl">{p.title}</h1>
      {p.updatedAt && (
        <p className="mt-1 text-xs text-brand-muted">Last updated {new Date(p.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "2-digit" })}</p>
      )}

      <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-charcoal/80">
        <strong>Draft:</strong> This policy was prepared for development. Content marked <code className="font-mono">[PLACEHOLDER]</code> needs to be
        confirmed by the business owner, and the whole document should be reviewed by qualified legal counsel before being published to real customers.
      </div>

      <article className="prose prose-sm mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

      <aside className="mt-12 border-t border-brand-line pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-deep">More policies</p>
        <ul className="mt-3 grid gap-2 text-sm md:grid-cols-3">
          {related.map((s) => (
            <li key={s}>
              <Link href={`/p/policies/${s}`} className="text-charcoal hover:text-gold-deep">
                → {s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
