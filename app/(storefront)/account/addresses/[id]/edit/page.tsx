import { notFound } from "next/navigation";
import { getAddress } from "@/lib/addresses";
import { AddressForm } from "@/components/account/AddressForm";

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const addr = await getAddress(id);
  if (!addr) notFound();
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <h2 className="brand-wordmark text-xl text-charcoal">Edit Address</h2>
      <div className="mt-6">
        <AddressForm initial={{ ...addr, state: addr.state as (string) }} />
      </div>
    </section>
  );
}
