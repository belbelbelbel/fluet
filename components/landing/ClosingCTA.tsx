"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { authPath } from "@/lib/auth-redirect";
import { Reveal } from "./Reveal";


export function ClosingCTA() {
  const { isSignedIn, isLoaded } = useUser();
  const href = isLoaded && isSignedIn ? "/dashboard" : authPath("sign-up", "/dashboard");

  return (
    <section className="px-6 pb-20 sm:px-10 sm:pb-24">
      <Reveal>
        <div className="relative mx-auto max-w-[88rem] overflow-hidden rounded-3xl bg-[rgb(var(--ink))] px-8 py-20 text-center sm:px-16 sm:py-28">
          {/* Faint rule grid, echoing the section frames above */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />

          <div className="relative">
            <h2 className="font-display mx-auto max-w-2xl text-[clamp(2.2rem,5vw,3.5rem)] text-white">
              Your next post shouldn't need
              <br className="hidden sm:block" /> a{" "}
              <span className="italic">follow-up message</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[15.5px] leading-relaxed text-white/60">
              Set up your first client in a few minutes. Free while you try it —
              no card needed.
            </p>
            <Link
              href={href}
              className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14.5px] font-medium text-[rgb(var(--ink))] transition-opacity hover:opacity-90"
            >
              Start free
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
