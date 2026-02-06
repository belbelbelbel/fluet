"use client";
import { Button } from "@/components/ui/button";
import { CheckIcon, StarIcon, ZapIcon, ShieldIcon, ArrowRightIcon, MinusIcon, PlusIcon, LayersIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useCallback, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { showToast } from "@/lib/toast";

type PaymentProvider = "stripe" | "kora";

const pricingPlans = [
  {
    id: "basic",
    name: "Basic plan",
    description: "Perfect for individuals getting started",
    price: "10",
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    popular: false,
    icon: ZapIcon,
    features: [
      "Flexible Plans",
      "Scalability",
      "24/7 Email Support",
      "20GB Recording",
      "Basic Analytics",
      "2 Social Platforms",
    ],
  },
  {
    id: "pro",
    name: "Business plan",
    description: "For content creators and small teams",
    price: "29",
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    popular: true,
    badge: "Best Value",
    icon: LayersIcon,
    features: [
      "Access to all basic features",
      "Basic reporting and analytics",
      "Up to 10 individual users",
      "20GB individual data storage",
      "All social platforms",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise plan",
    description: "For agencies and large teams",
    price: "Custom",
    priceId: null,
    popular: false,
    icon: LayersIcon,
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

export function PricingSection() {
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [userCount, setUserCount] = useState(1);

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
    <section id="pricing" className="relative py-32 sm:py-40 lg:py-48 bg-white scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-200 rounded-full mb-6">
              <span className="text-sm text-purple-900 font-medium">Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Simple Pricing, Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Simple, transparent pricing that grows with you. Try any plan free for 30 days.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-blue-50 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "yearly"
                      ? "bg-blue-50 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annual billing
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
            {pricingPlans.map((plan) => {
              const displayPrice = billingCycle === "yearly" && plan.price !== "Custom" 
                ? getYearlyPrice(plan.price) 
                : plan.price;
              const Icon = plan.icon;
              const isPopular = plan.popular;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl transition-all ${
                    isPopular
                      ? "bg-gradient-to-b from-purple-900 to-purple-800 text-white"
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 right-4">
                      <div className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg transform rotate-2">
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${
                      isPopular ? "bg-white/20" : "bg-blue-50"
                    }`}>
                      <Icon className={`w-6 h-6 ${isPopular ? "text-white" : "text-blue-600"}`} />
                    </div>

                    {/* Plan Name */}
                    <h3 className={`text-xl font-bold mb-2 ${isPopular ? "text-white" : "text-gray-900"}`}>
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        {plan.price !== "Custom" ? (
                          <>
                            <span className={`text-5xl font-bold ${isPopular ? "text-white" : "text-gray-900"}`}>
                              ${displayPrice}
                            </span>
                            <span className={`text-lg ${isPopular ? "text-white/80" : "text-gray-600"}`}>
                              /month
                            </span>
                          </>
                        ) : (
                          <span className={`text-5xl font-bold ${isPopular ? "text-white" : "text-gray-900"}`}>
                            Custom
                          </span>
                        )}
                      </div>
                      {billingCycle === "yearly" && plan.price !== "Custom" && (
                        <p className={`text-sm ${isPopular ? "text-white/70" : "text-gray-500"}`}>
                          Billed annually.
                        </p>
                      )}
                    </div>

                    {/* User Selector */}
                    {plan.id !== "enterprise" && (
                      <div className={`flex items-center justify-between mb-6 p-2 rounded-lg ${
                        isPopular 
                          ? "bg-white/10 border border-white/20" 
                          : "bg-gray-50 border border-gray-200"
                      }`}>
                        <button
                          onClick={() => setUserCount(Math.max(1, userCount - 1))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isPopular 
                              ? "bg-white/20 hover:bg-white/30" 
                              : "bg-white hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <MinusIcon className={`w-4 h-4 ${isPopular ? "text-white" : "text-gray-700"}`} />
                        </button>
                        <span className={`text-sm font-medium ${isPopular ? "text-white" : "text-gray-900"}`}>
                          {userCount} USER{userCount !== 1 ? "S" : ""}
                        </span>
                        <button
                          onClick={() => setUserCount(userCount + 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isPopular 
                              ? "bg-white/20 hover:bg-white/30" 
                              : "bg-white hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <PlusIcon className={`w-4 h-4 ${isPopular ? "text-white" : "text-gray-700"}`} />
                        </button>
                      </div>
                    )}

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isPopular ? "bg-white/20" : "bg-gray-100"
                          }`}>
                            <CheckIcon className={`w-3 h-3 ${isPopular ? "text-white" : "text-blue-600"}`} />
                          </div>
                          <span className={`text-sm ${isPopular ? "text-white/90" : "text-gray-600"}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {showPaymentOptions === plan.priceId ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSelectedProvider("stripe")}
                            className={`p-3 rounded-lg border transition-colors text-sm ${
                              selectedProvider === "stripe"
                                ? isPopular
                                  ? "border-white bg-white/20 text-white"
                                  : "border-gray-900 bg-gray-50 text-gray-900"
                                : isPopular
                                  ? "border-white/30 text-white/80 hover:border-white/50 bg-white/10"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="font-medium mb-1">Stripe</div>
                            <div className={`text-xs ${isPopular ? "text-white/70" : "text-gray-500"}`}>Cards</div>
                          </button>
                          <button
                            onClick={() => setSelectedProvider("kora")}
                            className={`p-3 rounded-lg border transition-colors text-sm ${
                              selectedProvider === "kora"
                                ? isPopular
                                  ? "border-white bg-white/20 text-white"
                                  : "border-gray-900 bg-gray-50 text-gray-900"
                                : isPopular
                                  ? "border-white/30 text-white/80 hover:border-white/50 bg-white/10"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className="font-medium mb-1">Kora</div>
                            <div className={`text-xs ${isPopular ? "text-white/70" : "text-gray-500"}`}>Local</div>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            className={`flex-1 rounded-xl ${
                              isPopular
                                ? "border-white/30 text-white hover:bg-white/20"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => plan.priceId && selectedProvider && handleSubscribe(plan.priceId, selectedProvider)}
                            disabled={isLoading || !selectedProvider}
                            className={`flex-1 rounded-xl ${
                              isPopular
                                ? "bg-white text-purple-900 hover:bg-white/90"
                                : "bg-gray-900 hover:bg-gray-800 text-white"
                            }`}
                          >
                            {isLoading ? "Processing..." : "Continue"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handlePlanSelect(plan.priceId)}
                        disabled={isLoading}
                        className={`w-full py-3 font-semibold rounded-xl ${
                          isPopular
                            ? "bg-white text-purple-900 hover:bg-white/90"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
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

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
              <ShieldIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">256-bit SSL encryption</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
              <ZapIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
              <p className="text-sm text-gray-600">No long-term contracts</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
              <StarIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">14-Day Money Back</h3>
              <p className="text-sm text-gray-600">Risk-free guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
