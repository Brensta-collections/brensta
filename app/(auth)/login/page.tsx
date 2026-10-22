import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";
import { sanitizeAccountNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const rawNext = typeof sp.next === "string" ? sp.next : undefined;
  const nextPath = sanitizeAccountNext(rawNext);

  // If the visitor is already signed in, send them straight to their intended
  // destination (never back onto /login, which sanitizeAccountNext already
  // excludes). Middleware's matcher does not cover /login, so there's no loop.
  const session = await auth();
  if (session?.user) redirect(nextPath);

  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;
  const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your BRENSTA account."
      footer={
        <>
          New to BRENSTA?{" "}
          <Link href={registerHref} className="font-semibold text-gold-deep underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
