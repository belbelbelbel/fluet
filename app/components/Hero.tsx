"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function Hero() {
  const { isSignedIn } = useUser();

  return (
    <section className="relative bg-white overflow-hidden pt-48 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
        {/* Centered Hero Content */}
        <div className="flex flex-col items-center text-center space-y-8 mb-16 mt-6">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-950 max-w-5xl">
            Built for{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-7xl drop-shadow-sm">
                Nigerian
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-purple-700/20 to-purple-800/20 blur-xl -z-10"></span>
            </span>{" "}
            Social Media Managers
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl font-normal">
            Manage, generate and schedule content for all your client accounts in one place. 
            Perfect for agencies managing multiple pages.
          </p>

          {/* Email CTA - Centered */}
          <div className="mt-8 w-full max-w-4xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
              />
              <Button
                asChild
                size='default'
                className="sm:w-auto bg-gray-950 hover:bg-gray-900 text-white px-8 py-4 text-base font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Link href={isSignedIn ? "/dashboard/generate" : "/sign-up"}>
                  Get Started
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Image - Centered Below */}
        <div className="relative w-full flex items-center justify-center mt-12">
          <div className="relative w-full max-w-6xl">
            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <Image
                src="/images/fluetdashboardimg.png"
                alt="Revvy Dashboard Preview"
                width={1920}
                height={1080}
                priority={true}
                loading="eager"
                className="rounded-xl shadow-2xl w-full h-auto object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1920px"
                quality={90}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
