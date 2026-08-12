"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeftIcon, CreditCardIcon, ShieldIcon } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { showToast } from "@/lib/toast";
import { LandingNav } from "@/components/landing/LandingNav";

/**
 * Checkout runs inside the `.landing` scope, not the dashboard shell: it is the
 * last step of the marketing funnel, so it should read like the pricing page
 * that sent the visitor here rather than like the app they haven't bought yet.
 *
 * That means the white canvas, Fraunces for the heading, and Geist Mono for every
 * number — and the deep-forest accent instead of the dashboard's purple.
 *
 * The summary is deliberately shaped as a receipt (mono figures, tabular
 * numerals, a dashed rule above the total). It matches the record-keeping
 * language the rest of the product uses.
 */

/** Shared input styling — hairline rule, accent focus, surface fill. */
const fieldClass =
  "w-full rounded-lg border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-[14px] text-[rgb(var(--ink))] outline-none transition-colors placeholder:text-[rgb(var(--ink-faint))] focus:border-[rgb(var(--accent))] focus:ring-2 focus:ring-[rgb(var(--accent))]/15";

const labelClass =
  "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.1em] text-[rgb(var(--ink-faint))]";

type PaymentProvider = "stripe" | "kora";

const pricingPlans = [
  {
    id: "basic",
    name: "Basic plan",
    description: "Perfect for freelance social media managers. AI content, scheduling, and basic analytics.",
    price: "10000",
    priceDisplay: "₦10,000",
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    features: [
      "AI Content Generation",
      "Multi-Platform Scheduling",
      "24/7 Email Support",
      "Basic Analytics",
      "2 Social Platforms",
      "Google Calendar Reminders",
    ],
  },
  {
    id: "pro",
    name: "Business plan",
    description: "For small agencies managing 3–10 clients. Advanced reporting, team collaboration, all platforms.",
    price: "25000",
    priceDisplay: "₦25,000",
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    features: [
      "Access to all basic features",
      "Advanced reporting and analytics",
      "Up to 10 team members",
      "All social platforms",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise plan",
    description: "For agencies and large teams. Unlimited users, dedicated support, API, white-label.",
    price: "Custom",
    priceDisplay: "Custom",
    priceId: null,
    features: [
      "Access to all basic features",
      "Advanced reporting and analytics",
      "Unlimited users",
      "Unlimited data storage",
      "Custom AI model training",
      "Dedicated account manager",
      "API access",
      "White-label options",
    ],
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded, user } = useUser();
  
  const planId = searchParams.get("plan") || "basic";
  const billingCycle = (searchParams.get("billing") || "monthly") as "monthly" | "yearly";
  
  const [selectedPlan, setSelectedPlan] = useState(
    () => pricingPlans.find(p => p.id === planId) || pricingPlans[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("NG");

  // Keep selected plan in sync with URL (e.g. when returning from pricing with different plan)
  useEffect(() => {
    const plan = pricingPlans.find(p => p.id === planId) || pricingPlans[0];
    setSelectedPlan(plan);
  }, [planId]);

  // Do NOT redirect to sign-in from here - same as dashboard: causes refresh loop for authenticated users.
  // Only show loading until Clerk is loaded; then show form or sign-in prompt.

  const getYearlyPrice = (monthlyPrice: string) => {
    if (monthlyPrice === "Custom") return "Custom";
    const price = parseInt(monthlyPrice);
    return (price * 10).toString();
  };

  const displayPrice = billingCycle === "yearly" && selectedPlan.price !== "Custom"
    ? getYearlyPrice(selectedPlan.price)
    : selectedPlan.price;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setExpiry(formatted);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) {
      setError("Please select a payment method");
      return;
    }

    if (!selectedPlan.priceId) {
      showToast.info("Contact Sales", "Please reach out to our team for enterprise pricing");
      return;
    }

    if (selectedProvider === "stripe" && (!cardNumber || !expiry || !cvc)) {
      setError("Please fill in all card details");
      return;
    }

    setIsLoading(true);
    setError(null);

    const planInfo = {
      name: selectedPlan.name,
      price: displayPrice === "Custom" ? "0" : displayPrice.toString(),
    };

    try {
      const endpoint = selectedProvider === "stripe" 
        ? "/api/create-checkout-session" 
        : "/api/create-kora-checkout";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          userId: user?.id,
          planName: planInfo.name,
          amount: planInfo.price,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (selectedProvider === "stripe") {
        const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripePublishableKey || stripePublishableKey.includes('your_stripe_publishable_key')) {
          throw new Error("Stripe publishable key is not configured");
        }
        
        const stripe = await loadStripe(stripePublishableKey);
        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else if (selectedProvider === "kora") {
        if (data.paymentLink) {
          window.location.href = data.paymentLink;
        } else {
          throw new Error("Kora payment link not received");
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      showToast.error("Payment Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvider, selectedPlan, displayPrice, billingCycle, user?.id, cardNumber, expiry, cvc]);

  // Same as dashboard: only wait for Clerk to load, never auto-redirect (prevents loop)
  if (!isLoaded) {
    return (
      <div className="landing min-h-dvh antialiased">
        <LandingNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-[rgb(var(--rule))] border-t-[rgb(var(--accent))]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))]">
              Loading checkout
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(`/checkout?plan=${planId}&billing=${billingCycle}`)}`;
    return (
      <div className="landing min-h-dvh antialiased">
        <LandingNav />
        <div className="flex min-h-[60vh] items-center justify-center px-5">
          <div className="max-w-sm text-center">
            <h1 className="font-display text-[clamp(1.7rem,4vw,2.2rem)] leading-tight text-[rgb(var(--ink))]">
              Sign in to continue
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--ink-soft))]">
              Your plan is held. Sign in and we&apos;ll bring you straight back here.
            </p>
            <button
              onClick={() => router.push(signInUrl)}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[rgb(var(--ink))] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing min-h-dvh antialiased">
      <LandingNav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div>
          {/* Header — mono eyebrow over a display line, as on the marketing pages */}
          <div className="mb-10 lg:mb-14">
            <button
              onClick={() => router.push("/pricing")}
              className="group mb-8 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))] transition-colors hover:text-[rgb(var(--ink))]"
            >
              <ArrowLeftIcon className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
              Back to pricing
            </button>
            <div className="max-w-xl">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[rgb(var(--ink-faint))]">
                Checkout
              </p>
              <h1 className="font-display mt-3 text-[clamp(2rem,4.6vw,2.9rem)] leading-[1.05] tracking-[-0.02em] text-[rgb(var(--ink))]">
                One step and you&apos;re <span className="italic">running</span>.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[rgb(var(--ink-soft))]">
                Card details go straight to Stripe or Kora — they never touch Revvy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-10">
            {/* Summary, shaped as a receipt: mono figures, tabular numerals,
                and a dashed rule above the total */}
            <aside className="order-2 lg:order-1">
              <div className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] p-5 shadow-[0_1px_2px_rgba(18,18,17,0.03),0_18px_36px_-24px_rgba(18,18,17,0.18)]">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))]">
                    Your plan
                  </p>
                  <h2 className="mt-2 text-[17px] font-medium leading-snug text-[rgb(var(--ink))]">
                    {selectedPlan.name}
                  </h2>
                  {"description" in selectedPlan && selectedPlan.description && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[rgb(var(--ink-soft))]">
                      {selectedPlan.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-[rgb(var(--rule))] pt-4">
                    <span className="text-[13px] text-[rgb(var(--ink-soft))]">
                      {billingCycle === "yearly" ? "Billed yearly" : "Billed monthly"}
                    </span>
                    <span className="font-mono text-[13px] tabular-nums text-[rgb(var(--ink))]">
                      {selectedPlan.price === "Custom"
                        ? "—"
                        : `₦${parseInt(displayPrice).toLocaleString("en-NG")}`}
                    </span>
                  </div>

                  {/* Dashed rather than solid — the detail that makes it read as a receipt */}
                  <div className="mt-4 border-t border-dashed border-[rgb(var(--rule))] pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
                        Due today
                      </span>
                      <span className="font-display text-[1.75rem] leading-none tabular-nums text-[rgb(var(--ink))]">
                        {selectedPlan.price === "Custom"
                          ? "Contact sales"
                          : `₦${parseInt(displayPrice).toLocaleString("en-NG")}`}
                      </span>
                    </div>
                    {selectedPlan.price !== "Custom" && (
                      <p className="mt-2 text-[12px] leading-relaxed text-[rgb(var(--ink-faint))]">
                        Renews at ₦{parseInt(displayPrice).toLocaleString("en-NG")}
                        {billingCycle === "yearly" ? "/year" : "/month"}. Cancel anytime.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/pricing")}
                    className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[rgb(var(--accent))] underline decoration-[rgb(var(--accent))]/30 underline-offset-4 transition-colors hover:decoration-[rgb(var(--accent))]"
                  >
                    Change plan
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-2 px-1">
                  <ShieldIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--ink-faint))]" />
                  <p className="text-[12px] leading-relaxed text-[rgb(var(--ink-faint))]">
                    Your plan activates the moment payment succeeds.
                  </p>
                </div>
              </div>
            </aside>

            {/* Payment method + form */}
            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] p-5 sm:p-6">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))]">
                  Payment method
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      { id: "stripe", name: "Stripe", meta: "Cards · international" },
                      { id: "kora", name: "Kora", meta: "Transfer · Nigeria" },
                    ] as const
                  ).map((p) => {
                    const active = selectedProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        aria-pressed={active}
                        className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
                          active
                            ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent-soft))]"
                            : "border-[rgb(var(--rule))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--ink))]/25"
                        }`}
                      >
                        {/* Radio drawn from tokens rather than a checkmark, so the
                            two options read as mutually exclusive */}
                        <span
                          className={`mt-[0.15rem] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            active
                              ? "border-[rgb(var(--accent))]"
                              : "border-[rgb(var(--ink))]/25"
                          }`}
                        >
                          {active && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-[rgb(var(--ink))]">
                            {p.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-[rgb(var(--ink-faint))]">
                            {p.meta}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6"></div>

                  {/* Stripe Payment Form */}
                  {selectedProvider === "stripe" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className={labelClass}>
                          Card number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="1234 1234 1234 1234"
                            maxLength={19}
                            className={fieldClass}
                            required
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <CreditCardIcon className="h-4 w-4 text-[rgb(var(--ink-faint))]" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className={fieldClass}
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="CVC"
                            maxLength={4}
                            className={fieldClass}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Country
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className={fieldClass}
                        >
                          <option value="NG">Nigeria</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>

                      {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
                          <p className="text-[13px] text-red-700">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-[rgb(var(--ink))] py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-55"
                      >
                        {isLoading ? "Processing..." : "Complete Purchase"}
                      </button>
                    </form>
                  )}

                  {/* Kora Payment - Just button */}
                  {selectedProvider === "kora" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="rounded-lg border border-[rgb(var(--rule))] bg-[rgb(var(--inset))] px-3.5 py-3">
                        <p className="text-[13px] leading-relaxed text-[rgb(var(--ink-soft))]">
                          You will be redirected to Kora to complete your payment securely.
                        </p>
                      </div>
                      
                      {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
                          <p className="text-[13px] text-red-700">{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-[rgb(var(--ink))] py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-55"
                      >
                        {isLoading ? "Processing..." : "Continue to Kora"}
                      </button>
                    </form>
                  )}

                  {!selectedProvider && (
                    <p className="py-6 text-center font-mono text-[9.5px] uppercase tracking-[0.12em] text-[rgb(var(--ink-faint))]">
                      Please select a payment method above
                    </p>
                  )}

                  <div className="mt-6 border-t border-[rgb(var(--rule))] pt-5">
                    <p className="text-center text-[11.5px] leading-relaxed text-[rgb(var(--ink-faint))]">
                      By providing your card information, you allow Revvy to charge your card for future payments in accordance with our terms.
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="landing flex min-h-dvh items-center justify-center antialiased">
        <div className="text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-[rgb(var(--rule))] border-t-[rgb(var(--accent))]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))]">
            Loading checkout
          </p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
