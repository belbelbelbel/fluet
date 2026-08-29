"use client";

import type { ReactNode } from "react";

/**
 * Section wrapper. Previously drew vertical margin rules with crosshair corner
 * marks; those were removed. At the wider measure they fenced the content in
 * rather than framing it.
 */
export function RuledSection({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative ${className}`}>
      <div className="relative mx-auto w-full max-w-[88rem] px-6 sm:px-10 lg:px-14">
        {children}
      </div>
    </section>
  );
}

/** Section eyebrow: mono label with a short rule, used to open each section. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-6 bg-[rgb(var(--ink-faint))]" aria-hidden />
      <span className="label">{children}</span>
    </div>
  );
}
