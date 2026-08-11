import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-2">404</p>
      <h1 className="text-xl font-medium text-foreground mb-2">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        This dashboard page doesn&apos;t exist or was moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Dashboard home
        </Link>
        <Link
          href="/dashboard/clients"
          className="inline-flex h-10 items-center justify-center rounded-md border-[0.5px] border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          View clients
        </Link>
      </div>
    </div>
  );
}
