"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger within a group, in ms */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Scroll-reveal via IntersectionObserver + CSS transitions.
 *
 * Deliberately not framer-motion: this page is the top of the funnel, so every
 * kilobyte is conversion cost. The transition itself lives in globals.css
 * (`[data-reveal]`) which means it also respects prefers-reduced-motion in one
 * place rather than per-component.
 */
export function Reveal({ children, delay = 0, className = "", as }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the browser can't observe, just show the content.
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-reveal", "in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
