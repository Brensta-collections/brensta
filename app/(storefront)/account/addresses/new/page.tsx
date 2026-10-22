import { AddressForm } from "@/components/account/AddressForm";

export default function NewAddressPage() {
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <h2 className="brand-wordmark text-xl text-charcoal">Add Address</h2>
      <p className="mt-1 text-sm text-brand-muted">We ship to all serviceable Indian pincodes.</p>
      <div className="mt-6">
        <AddressForm />
      </div>
    </section>
  );
}
