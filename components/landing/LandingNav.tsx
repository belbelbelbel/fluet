"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MenuIcon, XIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { authPath } from "@/lib/auth-redirect";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const { isSignedIn, isLoaded } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryHref =
    isLoaded && isSignedIn ? "/dashboard" : authPath("sign-up", "/dashboard");
  const primaryLabel = isLoaded && isSignedIn ? "Dashboard" : "Start free";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[rgb(var(--rule))] bg-[rgb(var(--canvas))]/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[72px] w-full max-w-[88rem] items-center justify-between px-6 sm:px-10">
        <Link href="/" className="shrink-0" aria-label="Revvy home">
          <Logo size="sm" showText priority forceLight />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13.5px] text-[rgb(var(--ink-soft))] transition-colors hover:text-[rgb(var(--ink))]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {!isSignedIn && (
            <Link
              href={authPath("sign-in", "/dashboard")}
              className="rounded-lg px-3.5 py-2 text-[13.5px] text-[rgb(var(--ink-soft))] transition-colors hover:text-[rgb(var(--ink))]"
            >
              Log in
            </Link>
          )}
          <Link
            href={primaryHref}
            className="rounded-lg bg-[rgb(var(--ink))] px-4 py-2 text-[13.5px] font-medium text-white transition-opacity hover:opacity-85"
          >
            {primaryLabel}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 p-2 text-[rgb(var(--ink))] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[rgb(var(--rule))] bg-[rgb(var(--canvas))] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] text-[rgb(var(--ink-soft))]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={primaryHref}
              className="mt-2 rounded-lg bg-[rgb(var(--ink))] px-4 py-3 text-center text-[14px] font-medium text-white"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
