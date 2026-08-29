"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { showToast } from "@/lib/toast";
import { RuledSection, SectionLabel } from "./Frame";
import { Reveal } from "./Reveal";

/**
 * The single source of pricing on the site. The old app/components/PricingSection
 * and the standalone /pricing page duplicated these ids and prices; both are gone
 * and /pricing now redirects to this section.
 */
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 10000,
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    description: "For freelance social media managers running a handful of accounts.",
    cta: "Start free",
    popular: false,
    features: [
      "AI content drafting",
      "Multi-platform scheduling",
      "2 social platforms",
      "Basic analytics",
      "Google Calendar reminders",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Business",
    price: 25000,
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    description: "For small agencies managing 3-10 clients with a team behind them.",
    cta: "Start free",
    popular: true,
    features: [
      "Everything in Basic",
      "All social platforms",
      "Up to 10 team members",
      "Client approval dashboards",
      "Advanced reporting",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    priceId: null,
    description: "For larger teams that need control, white-labelling and an API.",
    cta: "Contact sales",
    popular: false,
    features: [
      "Everything in Business",
      "Unlimited users",
      "Custom AI model training",
      "White-label options",
      "API access",
      "Dedicated account manager",
    ],
  },
];

export function LandingPricing() {
  const router = useRouter();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSelect = (planId: string, priceId: string | null) => {
    if (!priceId) {
      showToast.info(
        "Contact Sales",
        "Please reach out to our team for enterprise pricing"
      );
      return;
    }
    router.push(`/checkout?plan=${planId}&billing=${cycle}`);
  };

  return (
    <RuledSection id="pricing" className="scroll-mt-24 py-20 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <SectionLabel>Pricing</SectionLabel>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="font-display mt-7 max-w-2xl text-[clamp(2.1rem,4.6vw,3.25rem)] text-[rgb(var(--ink))]">
            Priced for an agency, not an <span className="italic">enterprise</span>.
          </h2>
        </Reveal>

        {/* Billing toggle */}
        <Reveal delay={120}>
          <div className="mt-9 inline-flex items-center rounded-xl border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] p-1">
            {(["monthly", "yearly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCycle(option)}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium capitalize transition-colors ${
                  cycle === option
                    ? "bg-[rgb(var(--ink))] text-white"
                    : "text-[rgb(var(--ink-soft))] hover:text-[rgb(var(--ink))]"
                }`}
              >
                {option}
                {option === "yearly" && (
                  <span
                    className={`ml-1.5 font-mono text-[10px] ${
                      cycle === "yearly"
                        ? "text-white/70"
                        : "text-[rgb(var(--accent))]"
                    }`}
                  >
                    −2 MONTHS
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANS.map((plan, i) => {
          const amount =
            plan.price === null
              ? null
              : cycle === "yearly"
              ? plan.price * 10
              : plan.price;

          return (
            <Reveal key={plan.id} delay={i * 90}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 transition-shadow sm:p-8 ${
                  plan.popular
                    ? "border-[rgb(var(--ink))] bg-[rgb(var(--surface))] shadow-[0_16px_48px_-24px_rgba(18,18,17,0.32)]"
                    : "border-[rgb(var(--rule))] bg-[rgb(var(--surface))]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="label">{plan.name}</span>
                  {plan.popular && (
                    <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[rgb(var(--accent))]">
                      Most agencies
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  {amount === null ? (
                    <span className="font-display text-[2.75rem] leading-none text-[rgb(var(--ink))]">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="font-display text-[2.75rem] leading-none text-[rgb(var(--ink))]">
                        ₦{amount.toLocaleString()}
                      </span>
                      <span className="text-[13px] text-[rgb(var(--ink-faint))]">
                        /{cycle === "yearly" ? "yr" : "mo"}
                      </span>
                    </>
                  )}
                </div>

                <p className="mt-4 text-[14px] leading-relaxed text-[rgb(var(--ink-soft))]">
                  {plan.description}
                </p>

                <button
                  type="button"
                  onClick={() => handleSelect(plan.id, plan.priceId)}
                  className={`mt-7 w-full rounded-xl py-3 text-[14px] font-medium transition-opacity hover:opacity-85 ${
                    plan.popular
                      ? "bg-[rgb(var(--ink))] text-white"
                      : "bg-transparent text-[rgb(var(--ink))] ring-1 ring-[rgb(var(--rule))]"
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="mt-8 space-y-3 border-t border-[rgb(var(--rule))] pt-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckIcon
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--accent))]"
                        strokeWidth={2.5}
                      />
                      <span className="text-[13.5px] leading-snug text-[rgb(var(--ink-soft))]">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={150}>
        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
          Pay by card or bank transfer · Cancel anytime
        </p>
      </Reveal>
    </RuledSection>
  );
}
