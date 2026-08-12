import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { FAQ } from "@/components/landing/FAQ";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Marketing home.
 *
 * Server component by design — every section below is an isolated client
 * island, so the page itself ships no JS of its own. The `.landing` class
 * scopes the editorial type system and palette (see globals.css) to marketing
 * only, leaving the dashboard's Nunito theme untouched.
 */
export default function Home() {
  return (
    <div className="landing min-h-dvh antialiased">
      {/* Reveal animations hide content until observed. Without JS there is no
          observer, so unhide everything rather than ship a blank page. */}
      <noscript>
        <style>{`.landing [data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <LandingNav />
      <main>
        <LandingHero />
        <HowItWorks />
        <Features />
        <LandingPricing />
        <FAQ />
        <ClosingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
