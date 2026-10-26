"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error ID (digest) to the server log so the operator can
    // correlate it with the Next.js runtime log line.
    if (error.digest) console.error(`[client error] digest=${error.digest}`);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center md:px-6">
      <h1 className="brand-wordmark text-3xl text-charcoal md:text-4xl">Something went wrong</h1>
      <p className="text-sm text-brand-muted">
        We hit an unexpected error while loading this page. Please try again — if the issue persists, our team has
        already been notified.
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-brand-muted">Reference: {error.digest}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="primary" onClick={() => reset()}>Try again</Button>
        <Link
          href="/"
          className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm text-charcoal hover:border-gold hover:text-gold-deep"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
