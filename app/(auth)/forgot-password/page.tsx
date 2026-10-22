import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  const emailProviderConfigured = !!process.env.RESEND_API_KEY;
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <>
          <Link href="/login" className="text-gold-deep underline-offset-4 hover:underline">← Back to login</Link>
        </>
      }
    >
      <ForgotForm emailConfigured={emailProviderConfigured} />
    </AuthShell>
  );
}
