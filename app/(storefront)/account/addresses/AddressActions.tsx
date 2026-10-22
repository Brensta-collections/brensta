"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setDefaultAddress, deleteAddress } from "@/lib/addresses";

export function AddressActions({ id, isDefault }: { id: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-3 flex items-center gap-4 text-xs">
      <Link href={`/account/addresses/${id}/edit`} className="text-gold-deep hover:underline underline-offset-4">Edit</Link>
      {!isDefault && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => setDefaultAddress(id))}
          className="text-charcoal hover:text-gold-deep"
        >
          Make default
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this address?")) return;
          startTransition(() => deleteAddress(id));
        }}
        className="text-warm-brown hover:underline underline-offset-4"
      >
        Delete
      </button>
    </div>
  );
}
