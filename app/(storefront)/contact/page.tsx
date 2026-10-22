import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactForm } from "./ContactForm";
import { BUSINESS_EMAIL, BUSINESS_PHONE_DISPLAY, BUSINESS_PHONE_TEL, isPlaceholderContact } from "@/lib/business";

// Root title template is "%s | BRENSTA" — avoid doubling the brand name.
export const metadata: Metadata = {
  title: "Contact",
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

export default async function ContactPage() {
  const contact = await getContactSettings();

  // Email + phone fall back to the owner-supplied constants when the DB still
  // carries seeded placeholders. Address + WhatsApp have no owner-supplied
  // fallback and simply disappear until the admin publishes them.
  const email = isPlaceholderContact(contact.email) ? BUSINESS_EMAIL : contact.email;
  const phoneDisplay = isPlaceholderContact(contact.phone) ? BUSINESS_PHONE_DISPLAY : contact.phone;
  const phoneTel = isPlaceholderContact(contact.phone) ? BUSINESS_PHONE_TEL : contact.phone.replace(/[^\d+]/g, "");

  const whatsapp = isPlaceholderContact(contact.whatsapp) ? null : contact.whatsapp;
  const address = isPlaceholderContact(contact.address) ? null : contact.address;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Breadcrumbs items={[{ name: "Contact" }]} />
      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep">We&apos;re here to help</p>
        <h1 className="brand-wordmark mt-3 text-3xl text-charcoal md:text-4xl">Contact BRENSTA</h1>
        <p className="mt-2 text-sm text-brand-muted">We aim to reply as soon as possible.</p>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr]">
        {/* ───── Contact details ───── */}
        <section className="space-y-4">
          <ContactLine icon={<Mail className="h-4 w-4" />} label="Email" value={email} href={`mailto:${email}`} />
          <ContactLine icon={<Phone className="h-4 w-4" />} label="Phone" value={phoneDisplay} href={`tel:${phoneTel}`} />
          {whatsapp && (
            <ContactLine icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" value={whatsapp} />
          )}
          {address ? (
            <ContactLine icon={<MapPin className="h-4 w-4" />} label="Registered office" value={address} />
          ) : (
            <p className="rounded-lg border border-brand-line bg-white p-3 text-[11px] italic text-brand-muted">
              Our registered office address will appear here once the business owner publishes it from the admin settings.
            </p>
          )}
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

function ContactLine({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-brand-line bg-white p-4">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/60 text-gold-deep">{icon}</span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{label}</p>
        {href ? (
          <a href={href} className="mt-0.5 block text-sm text-charcoal hover:text-gold-deep">{value}</a>
        ) : (
          <p className="mt-0.5 text-sm text-charcoal">{value}</p>
        )}
      </div>
    </div>
  );
}
