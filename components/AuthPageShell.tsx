"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

interface AuthPageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthPageShell({ children, title, subtitle }: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <header className="border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="sm" showText priority />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && (
                <h1 className="text-xl font-medium text-gray-950 dark:text-white">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthLoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <AuthPageShell>
      <div className="text-center py-12">
        <div
          className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 dark:border-slate-600 dark:border-t-slate-200 rounded-full animate-spin mx-auto mb-4"
          aria-hidden
        />
        <p className="text-sm text-gray-600 dark:text-slate-400">{message}</p>
      </div>
    </AuthPageShell>
  );
}
