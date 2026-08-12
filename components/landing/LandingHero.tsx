"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { authPath } from "@/lib/auth-redirect";
import { ApprovalProof } from "./ApprovalProof";
import { Reveal } from "./Reveal";

export function LandingHero() {
  const { isSignedIn, isLoaded } = useUser();
  const ctaHref =
    isLoaded && isSignedIn ? "/dashboard" : authPath("sign-up", "/dashboard");

  return (
    <section className="relative flex min-h-[820px] items-center overflow-hidden py-14 lg:py-16">
      <div className="relative mx-auto grid w-full max-w-[88rem] grid-cols-1 items-center gap-20 px-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-20 lg:px-14">
        {/* ---- Copy ---- */}
        <div>
          <Reveal>
            <div className="inline-flex hidden items-center gap-2 rounded-full border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] py-1 pl-1 pr-3.5">
              <span className="rounded-full bg-[rgb(var(--accent))] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-white">
                New
              </span>
              <span className="text-[13px] text-[rgb(var(--ink-soft))]">
                Client approvals now work over email
              </span>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-display mt-8 text-[clamp(3.2rem,5.6vw,5.25rem)] text-[rgb(var(--ink))]">
              Stop chasing
              <br />
              clients for{" "}
              <span className="relative inline-block italic">
                approvals
                <svg
                  className="absolute -bottom-2 left-0 w-full text-[rgb(var(--accent))]"
                  viewBox="0 0 200 9"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 6.5C48 2.5 152 1.5 198 5.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 200,
                      strokeDashoffset: 200,
                      animation: "revvy-draw 1s ease-out 0.7s forwards",
                    }}
                  />
                </svg>
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-9 max-w-lg text-[17px] leading-relaxed text-[rgb(var(--ink-soft))]">
              Revvy gives your agency one link where clients review, approve and
              schedule — so nothing goes out unapproved, and nobody has to chase
              a WhatsApp reply again.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--ink))] px-7 py-4 text-[15px] font-medium text-white transition-opacity hover:opacity-85"
              >
                Start free
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="group inline-flex items-center gap-2 text-[15px] text-[rgb(var(--ink-soft))] transition-colors hover:text-[rgb(var(--ink))]"
              >
                See how it works
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
              From ₦10,000/mo · Card or bank transfer · No card to start
            </p>
          </Reveal>
        </div>

        {/* ---- Photograph ---- */}
        <Reveal delay={180}>
          <div className="relative">
            {/* Offset accent shape so the photo has something to sit against */}
            <div
              aria-hidden
              className="absolute -left-5 -top-6 h-[90%] w-[88%] rounded-[3rem] bg-[rgb(var(--accent-soft))]"
            />

            <div className="relative aspect-[4/3.6] w-full overflow-hidden rounded-[2.5rem] sm:aspect-[4/3.3]">
              <Image
                src="/images/landing/hero-agency.jpg"
                alt="A social media manager reviewing client work on a laptop"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                /* Desaturated on purpose. The photograph's out-of-focus right
                   side is a strong caramel, which was the only warm element left
                   once the palette went pure white — it read as a stock photo
                   rather than as art direction. Monochrome ties it to the black
                   type and leaves the forest accent as the page's single colour.
                   grayscale(1) with a slight contrast lift keeps it from going
                   flat. */
                className="object-cover object-[20%_center] [filter:grayscale(1)_contrast(1.06)]"
              />
            </div>

          </div>

          {/* One line of proof rather than a product diagram — see
              ApprovalProof for why four mock attempts were abandoned. */}
          <div className="mt-9 sm:mt-11">
            <ApprovalProof />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
