import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <h2 className="brand-wordmark text-xl text-charcoal">Change Password</h2>
      <p className="mt-1 text-sm text-brand-muted">Use a password you haven&apos;t used elsewhere.</p>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </section>
  );
}
