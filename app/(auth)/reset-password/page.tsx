import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
      footer={<Link href="/login" className="text-gold-deep underline-offset-4 hover:underline">← Back to login</Link>}
    >
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
