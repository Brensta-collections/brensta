import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "./RegisterForm";
import { sanitizeAccountNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const rawNext = typeof sp.next === "string" ? sp.next : undefined;
  const nextPath = sanitizeAccountNext(rawNext);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save addresses, track orders and build your wishlist."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
