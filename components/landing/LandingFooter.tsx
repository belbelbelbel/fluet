"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "#how", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[rgb(var(--rule))]">
      <div className="mx-auto w-full max-w-[88rem] px-6 py-16 sm:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Logo size="sm" showText forceLight />
            <p className="mt-4 max-w-[16rem] text-[13.5px] leading-relaxed text-[rgb(var(--ink-soft))]">
              Approval workflow and client dashboards for social media agencies.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="label">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-[rgb(var(--ink-soft))] transition-colors hover:text-[rgb(var(--ink))]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-[rgb(var(--rule))] pt-7 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
            © {new Date().getFullYear()} Revvy
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
            Made in Lagos
          </p>
        </div>
      </div>
    </footer>
  );
}
