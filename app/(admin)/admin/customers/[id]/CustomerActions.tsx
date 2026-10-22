"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { toggleCustomerActive } from "@/lib/admin/customers";

export function CustomerActions({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <section className="rounded-xl border border-brand-line bg-white p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">Actions</h3>
      <Button
        type="button"
        variant={isActive ? "outline" : "primary"}
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(isActive ? "Disable this account? The customer will not be able to sign in." : "Re-enable this account?")) return;
          startTransition(() => toggleCustomerActive(userId));
        }}
        className="mt-3 w-full"
      >
        {isActive ? "Disable account" : "Re-enable account"}
      </Button>
      <p className="mt-2 text-[10px] text-brand-muted">Only strict admins (not staff) can disable an account.</p>
    </section>
  );
}
