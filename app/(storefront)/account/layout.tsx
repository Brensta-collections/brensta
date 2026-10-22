import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireUser } from "@/lib/auth-helpers";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">My Account</h1>
      <p className="mt-1 text-sm text-brand-muted">Hi, {user.name ?? user.email}.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
