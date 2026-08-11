"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Something went wrong
      </p>
      <h1 className="text-xl font-medium text-foreground mb-2">
        Couldn&apos;t load this page
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
        {error.message ||
          "An unexpected error occurred. Try again or go back to your dashboard."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border-[0.5px] border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Dashboard home
        </Link>
      </div>
    </div>
  );
}
