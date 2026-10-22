import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact BRENSTA",
  description: "Reach the BRENSTA team — support, press and partnership queries.",
  alternates: { canonical: "/contact" },
};

async function getContactSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["contact.email", "contact.phone", "contact.whatsapp", "contact.address"] } },
  });
  const m = new Map(rows.map((r) => [r.key, r.value as unknown as string]));
  return {
    email: m.get("contact.email") || "",
    phone: m.get("contact.phone") || "",
    whatsapp: m.get("contact.whatsapp") || "",
    address: m.get("contact.address") || "",
  };
}

function formatValue(v: string): { text: string; isPlaceholder: boolean } {
  if (!v || /\[PLACEHOLDER\]/.test(v) || /^\+?91-?0{3,}/.test(v)) {
    return { text: "[Placeholder — the owner will set this soon]", isPlaceholder: true };
  }
  return { text: v, isPlaceholder: false };
}

export default async function ContactPage() {
  const contact = await getContactSettings();
  const email = formatValue(contact.email);
  const phone = formatValue(contact.phone);
  const whatsapp = formatValue(contact.whatsapp);
  const address = formatValue(contact.address);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "Contact" }]} />
      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">We&apos;re here to help</p>
        <h1 className="brand-wordmark mt-3 text-3xl text-charcoal md:text-4xl">Contact BRENSTA</h1>
        <p className="mt-2 text-sm text-brand-muted">We typically respond within one working day.</p>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr]">
        {/* ───── Contact details ───── */}
        <section className="space-y-4">
          <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={email.text} isPlaceholder={email.isPlaceholder} />
          <ContactLine icon={<Phone className="h-4 w-4" />} label="Phone" value={phone.text} isPlaceholder={phone.isPlaceholder} />
          <ContactLine icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={whatsapp.text} isPlaceholder={whatsapp.isPlaceholder} />
          <ContactLine icon={<MapPin className="h-4 w-4" />} label="Registered office" value={address.text} isPlaceholder={address.isPlaceholder} />

          <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-[11px] text-charcoal/80">
            This is a development build. Business contact details above are placeholders until the owner publishes them from the admin settings.
          </p>
        </section>

        {/* ───── Form ───── */}
        <section className="rounded-2xl border border-brand-line bg-white p-6">
          <h2 className="brand-wordmark text-xl text-charcoal">Send a message</h2>
          <p className="mt-1 text-xs text-brand-muted">We&apos;ll never share your email with anyone else.</p>
          <div className="mt-4"><ContactForm /></div>
        </section>
      </div>
    </div>
  );
}

function ContactLine({ icon, label, value, isPlaceholder }: { icon: React.ReactNode; label: string; value: string; isPlaceholder: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-brand-line bg-white p-4">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/60 text-gold-deep">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{label}</p>
        <p className={`mt-0.5 text-sm ${isPlaceholder ? "italic text-brand-muted" : "text-charcoal"}`}>{value}</p>
      </div>
    </div>
  );
}
