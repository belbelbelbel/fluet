import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 h-14 flex items-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size="sm" showText priority />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">404</p>
          <h1 className="text-2xl font-medium text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border-[0.5px] border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
