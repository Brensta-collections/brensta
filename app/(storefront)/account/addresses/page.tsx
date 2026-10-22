import { Plus } from "lucide-react";
import { listAddresses } from "@/lib/addresses";
import { LinkButton } from "@/components/ui/LinkButton";
import { AddressActions } from "./AddressActions";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AddressesPage() {
  const addresses = await listAddresses();
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="brand-wordmark text-xl text-charcoal">My Addresses</h2>
          <p className="mt-1 text-sm text-brand-muted">Saved addresses are used at checkout.</p>
        </div>
        <LinkButton href="/account/addresses/new" variant="outline" size="sm"><Plus className="h-4 w-4" /> Add address</LinkButton>
      </div>

      <div className="mt-6">
        {addresses.length === 0 ? (
          <EmptyState title="No addresses yet" description="Add your first address to speed up checkout." cta={{ label: "Add address", href: "/account/addresses/new" }} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-xl border border-brand-line bg-ivory p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                      {a.name}
                      {a.isDefault && <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-deep">Default</span>}
                      {a.label && <span className="text-xs font-normal text-brand-muted">· {a.label}</span>}
                    </p>
                    <p className="mt-1 text-sm text-charcoal/80">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                    <p className="text-sm text-charcoal/80">{a.city}, {a.state} — {a.pincode}</p>
                    <p className="mt-1 text-xs text-brand-muted">Mobile: {a.phone}</p>
                  </div>
                </div>
                <AddressActions id={a.id} isDefault={a.isDefault} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
