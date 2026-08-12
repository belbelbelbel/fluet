"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { authPath } from "@/lib/auth-redirect";

export function Hero() {
  const { isSignedIn, isLoaded } = useUser();

  const getStartedHref =
    isLoaded && isSignedIn
      ? "/dashboard/generate"
      : authPath("sign-in", "/dashboard/generate");

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-purple-50/30 to-white"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-30 bg-purple-400/20"
          aria-hidden
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-purple-300/20"
          aria-hidden
        />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl w-full">
        {/* Hero Content - Responsive padding */}
        <div
          className="flex flex-col items-center text-center
            pt-24 pb-8 sm:pt-32 sm:pb-12 md:pt-40 md:pb-14 lg:pt-44 lg:pb-16 xl:pt-48 xl:pb-20
            space-y-6 sm:space-y-7 md:space-y-8"
        >
          {/* Main Headline - Fluid typography */}
          <h1
            id="hero-heading"
            className="font-bold leading-[1.1] tracking-tight max-w-5xl
              text-[2.25rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
              text-foreground"
          >
            Built for{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent font-extrabold drop-shadow-sm">
                Nigerian
              </span>
              <span
                className="absolute inset-0 blur-xl -z-10 bg-gradient-to-r from-purple-600/20 via-purple-700/20 to-purple-800/20"
                aria-hidden
              />
            </span>{" "}
            Social Media Managers
          </h1>

          {/* Subheading - Responsive */}
          <p
            className="leading-relaxed max-w-3xl font-normal
              text-base sm:text-lg md:text-xl lg:text-2xl
              text-muted-foreground"
          >
            Manage, generate and schedule content for all your client accounts in
            one place. Perfect for agencies managing multiple pages.
          </p>

          {/* CTA - Responsive layout and sizing */}
          <div className="mt-4 sm:mt-6 w-full max-w-xl sm:max-w-2xl md:max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 min-w-0 w-full px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border text-base
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-colors duration-200
                  bg-white border-border text-foreground placeholder-gray-500 hover:border-gray-400 shadow-sm"
                aria-label="Email address"
              />
              <Button
                asChild
                size="default"
                className="w-full sm:w-auto min-h-[48px] sm:min-h-[56px] px-6 sm:px-8 py-3.5 sm:py-4 text-base font-semibold rounded-xl sm:rounded-2xl
                  bg-purple-600 hover:bg-purple-700 text-white
                  shadow-lg hover:shadow-xl shadow-purple-500/25
                  transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Link href={getStartedHref}>
                  Get Started
                  <ArrowRightIcon className="w-5 h-5 shrink-0" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Preview - Responsive container */}
        <div className="relative w-full flex items-center justify-center px-0 sm:px-2 md:px-4">
          <div className="relative w-full max-w-6xl">
            {/* Decorative border/glow */}
            <div
              className="absolute -inset-1 sm:-inset-2 rounded-2xl sm:rounded-3xl -z-10 blur-xl opacity-40 bg-purple-400/30"
              aria-hidden
            />
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ring-1 bg-accent ring-gray-200/50">
              <Image
                src="/images/fluetdashboardimg.png"
                alt="Fluet Dashboard - Manage social media for multiple clients"
                width={1920}
                height={1080}
                priority
                loading="eager"
                className="w-full h-full object-cover object-top"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, (max-width: 1280px) 90vw, 1152px"
                quality={90}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
