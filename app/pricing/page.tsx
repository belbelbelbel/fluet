"use client";
import { Button } from "@/components/ui/button";
import { CheckIcon, StarIcon, CrownIcon, ZapIcon, ShieldIcon, SparklesIcon, ArrowRightIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useCallback, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Navbar } from "../components/Navbar";
import { showToast } from "@/lib/toast";

type PaymentProvider = "stripe" | "kora";

const pricingPlans = [
  {
    id: "basic",
    name: "Starter",
    description: "Perfect for individuals getting started",
    price: "9",
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    popular: false,
    features: [
      "100 AI-generated posts per month",
      "Twitter & Instagram content",
      "Basic content templates",
      "Content history & export",
      "Email support",
    ],
    limitations: [
      "Limited to 2 platforms",
      "Basic analytics only",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    description: "For content creators and small teams",
    price: "29",
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    popular: true,
    badge: "Most Popular",
    features: [
      "500 AI-generated posts per month",
      "All platforms: Twitter, Instagram, LinkedIn, TikTok",
      "Advanced content templates",
      "We post for you automatically",
      "Advanced analytics dashboard",
      "Priority email support",
      "Bulk content generation",
      "Custom tone & style presets",
    ],
    savings: "Save 35% vs Starter",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For agencies and large teams",
    price: "Custom",
    priceId: null,
    popular: false,
    features: [
      "Unlimited AI-generated posts",
      "All social media platforms",
      "Custom AI model training",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations (API access)",
      "Advanced team collaboration",
      "SLA guarantee (99.9% uptime)",
      "Onboarding & training included",
    ],
  },
];

const allFeatures = [
  { name: "AI-generated posts per month", basic: "100", pro: "500", enterprise: "Unlimited" },
  { name: "Social media platforms", basic: "2", pro: "4", enterprise: "All" },
  { name: "Content templates", basic: "Basic", pro: "Advanced", enterprise: "Custom" },
  { name: "We post for you automatically", basic: "❌", pro: "✅", enterprise: "✅" },
  { name: "Analytics dashboard", basic: "Basic", pro: "Advanced", enterprise: "Enterprise" },
  { name: "Bulk generation", basic: "❌", pro: "✅", enterprise: "✅" },
  { name: "API access", basic: "❌", pro: "❌", enterprise: "✅" },
  { name: "Support", basic: "Email", pro: "Priority", enterprise: "Dedicated" },
];

export default function PricingPage() {
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const planMap = useMemo(() => {
    const map = new Map<string, { name: string; price: string }>();
    pricingPlans.forEach(plan => {
      if (plan.priceId) {
        const monthlyPrice = parseInt(plan.price);
        const yearlyPrice = billingCycle === "yearly" ? Math.round(monthlyPrice * 10) : monthlyPrice;
        map.set(plan.priceId, { name: plan.name, price: yearlyPrice.toString() });
      }
    });
    return map;
  }, [billingCycle]);

  const handlePlanSelect = useCallback((priceId: string | null) => {
    if (!priceId) {
      showToast.info("Contact Sales", "Please reach out to our team for enterprise pricing");
      return;
    }
    if (!isSignedIn) {
      setError("Please sign in to subscribe");
      showToast.error("Sign in required", "Please sign in to continue with your subscription");
      return;
    }
    setShowPaymentOptions(priceId);
    setSelectedPlan(priceId);
    setSelectedProvider(null);
    setError(null);
  }, [isSignedIn]);

  const handleSubscribe = useCallback(async (priceId: string, provider: PaymentProvider) => {
    if (!isSignedIn || !provider) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const planInfo = planMap.get(priceId) || { name: "Unknown", price: "0" };

    try {
      const endpoint = provider === "stripe" 
        ? "/api/create-checkout-session" 
        : "/api/create-kora-checkout";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: user?.id,
          planName: planInfo.name,
          amount: planInfo.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (provider === "stripe") {
        const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!stripePublishableKey || stripePublishableKey.includes('your_stripe_publishable_key')) {
          throw new Error("Stripe publishable key is not configured");
        }
        
        const stripe = await loadStripe(stripePublishableKey);
        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else if (provider === "kora") {
        if (data.paymentLink) {
          window.location.href = data.paymentLink;
        } else {
          throw new Error("Kora payment link not received");
        }
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      showToast.error("Payment Error", errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
      setShowPaymentOptions(null);
      setSelectedProvider(null);
    }
  }, [isSignedIn, user?.id, planMap]);

  const handleCancel = useCallback(() => {
    setShowPaymentOptions(null);
    setSelectedPlan(null);
    setSelectedProvider(null);
  }, []);

  const getYearlyPrice = (monthlyPrice: string) => {
    if (monthlyPrice === "Custom") return "Custom";
    const price = parseInt(monthlyPrice);
    return Math.round(price * 10).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header Section - Consistent */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <SparklesIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-base text-gray-400 max-w-2xl mx-auto mb-8">
              Start free, upgrade as you grow. All plans include our core features with no hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${billingCycle === "monthly" ? "text-white" : "text-gray-500"}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative w-14 h-7 bg-gray-800 rounded-full transition-colors"
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    billingCycle === "yearly" ? "translate-x-7" : ""
                  }`}
                />
              </button>
              <span className={`text-sm ${billingCycle === "yearly" ? "text-white" : "text-gray-500"}`}>
                Yearly
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                  Save 17%
                </span>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {pricingPlans.map((plan) => {
              const displayPrice = billingCycle === "yearly" && plan.price !== "Custom" 
                ? getYearlyPrice(plan.price) 
                : plan.price;
              const monthlyEquivalent = plan.price !== "Custom" && billingCycle === "yearly"
                ? `$${plan.price}/mo`
                : null;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border transition-all ${
                    plan.popular
                      ? "border-blue-500 bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl shadow-blue-500/20 scale-105 lg:scale-100"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    {/* Plan Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        {plan.price !== "Custom" ? (
                          <>
                            <span className="text-5xl font-bold text-white">${displayPrice}</span>
                            <span className="text-gray-400">
                              {billingCycle === "yearly" ? "/year" : "/month"}
                            </span>
                          </>
                        ) : (
                          <span className="text-5xl font-bold text-white">Custom</span>
                        )}
                      </div>
                      {monthlyEquivalent && (
                        <p className="text-sm text-gray-500 mt-1">
                          {monthlyEquivalent} billed annually
                        </p>
                      )}
                      {plan.savings && (
                        <p className="text-sm text-green-400 mt-2 font-medium">{plan.savings}</p>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations?.map((limitation, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {showPaymentOptions === plan.priceId ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSelectedProvider("stripe")}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              selectedProvider === "stripe"
                                ? "border-blue-500 bg-blue-500/10 text-white"
                                : "border-gray-700 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            <div className="font-medium mb-1">Stripe</div>
                            <div className="text-xs opacity-75">Cards</div>
                          </button>
                          <button
                            onClick={() => setSelectedProvider("kora")}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              selectedProvider === "kora"
                                ? "border-green-500 bg-green-500/10 text-white"
                                : "border-gray-700 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            <div className="font-medium mb-1">Kora</div>
                            <div className="text-xs opacity-75">Local</div>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => plan.priceId && selectedProvider && handleSubscribe(plan.priceId, selectedProvider)}
                            disabled={isLoading || !selectedProvider}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isLoading ? "Processing..." : "Continue"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handlePlanSelect(plan.priceId)}
                        disabled={isLoading}
                        className={`w-full py-3 font-semibold ${
                          plan.popular
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            : "bg-gray-800 hover:bg-gray-700 text-white"
                        }`}
                      >
                        {plan.priceId ? "Get Started" : "Contact Sales"}
                        {plan.priceId && <ArrowRightIcon className="w-4 h-4 ml-2" />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-10">
              Compare Plans
            </h2>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Features</th>
                      <th className="text-center p-4 text-sm font-semibold text-white">Starter</th>
                      <th className="text-center p-4 text-sm font-semibold text-white bg-blue-500/10">Professional</th>
                      <th className="text-center p-4 text-sm font-semibold text-white">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map((feature, idx) => (
                      <tr key={idx} className="border-b border-gray-800/50 last:border-0">
                        <td className="p-4 text-sm text-gray-300">{feature.name}</td>
                        <td className="p-4 text-center text-sm text-gray-400">{feature.basic}</td>
                        <td className="p-4 text-center text-sm text-white bg-blue-500/5">{feature.pro}</td>
                        <td className="p-4 text-center text-sm text-gray-400">{feature.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-6 bg-gray-900/30 rounded-lg border border-gray-800">
              <ShieldIcon className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-400">256-bit SSL encryption</p>
            </div>
            <div className="text-center p-6 bg-gray-900/30 rounded-lg border border-gray-800">
              <ZapIcon className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Cancel Anytime</h3>
              <p className="text-sm text-gray-400">No long-term contracts</p>
            </div>
            <div className="text-center p-6 bg-gray-900/30 rounded-lg border border-gray-800">
              <StarIcon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">14-Day Money Back</h3>
              <p className="text-sm text-gray-400">Risk-free guarantee</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I change plans later?",
                  a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards via Stripe and local payment methods via Kora (for supported regions).",
                },
                {
                  q: "Do you offer refunds?",
                  a: "Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes! All plans start with a 7-day free trial. No credit card required to start.",
                },
              ].map((faq, idx) => (
                <div key={idx} className="p-5 bg-gray-900/30 rounded-lg border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
