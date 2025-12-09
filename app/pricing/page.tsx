"use client";
import { Button } from "@/components/ui/button";
import { CheckIcon, BotIcon, StarIcon, CrownIcon, TrendingUpIcon, GlobeIcon, CreditCardIcon } from "lucide-react";

import { useUser } from "@clerk/nextjs";
import { useState, useCallback, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Navbar } from "../components/Navbar";

type PaymentProvider = "stripe" | "kora";

const pricingPlans = [
  {
    name: "Basic",
    price: "9",
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    icon: <BotIcon className="w-8 h-8 text-blue-400" />,
    features: [
      "100 AI-generated posts per month",
      "Twitter thread generation",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    price: "29",
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    icon: <StarIcon className="w-8 h-8 text-yellow-400" />,
    features: [
      "500 AI-generated posts per month",
      "Twitter, Instagram, LinkedIn, and TikTok content",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceId: null,
    icon: <CrownIcon className="w-8 h-8 text-purple-400" />,
    features: [
      "Unlimited AI-generated posts",
      "All social media platforms",
      "Custom AI model training",
      "Dedicated account manager",
    ],
  },
];

export default function PricingPage() {
  const { isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<string | null>(null);

  const planMap = useMemo(() => {
    const map = new Map<string, { name: string; price: string }>();
    pricingPlans.forEach(plan => {
      if (plan.priceId) {
        map.set(plan.priceId, { name: plan.name, price: plan.price });
      }
    });
    return map;
  }, []);

  const handlePlanSelect = useCallback((priceId: string | null) => {
    if (!priceId) {
      // Enterprise plan - contact sales
      return;
    }
    if (!isSignedIn) {
      setError("Please sign in to subscribe");
      return;
    }
    setShowPaymentOptions(priceId);
    setSelectedPlan(priceId);
    setSelectedProvider(null); // Reset provider selection
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
          throw new Error("Stripe publishable key is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file.");
        }
        
        const stripe = await loadStripe(stripePublishableKey);
        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else if (provider === "kora") {
        // Kora returns a payment link to redirect to
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
      // Clear error after 5 seconds
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

  return (
    <div className="min-h-screen bg-gradient-to-b pt-20 from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4  sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-4">
              <TrendingUpIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mr-2" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Pricing Plans
              </h1>
            </div>
            <p className="text-base sm:text-lg text-gray-400 px-4">
              Choose the perfect plan for your content creation needs
            </p>
          </div>

          {error && (
            <div className="max-w-6xl mx-auto mb-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              <p className="font-semibold">Error: {error}</p>
              {error.includes("not configured") && (
                <p className="text-sm mt-2">
                  Please check your .env.local file and ensure the required payment provider keys are set.
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-lg border border-gray-800 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col hover:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="flex items-center space-x-3 mb-4">
                  {plan.icon}
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {plan.name}
                  </h2>
                </div>
                <p className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                  ${plan.price}
                  <span className="text-base sm:text-lg font-normal text-gray-400">
                    /month
                  </span>
                </p>
                <ul className="mb-8 flex-grow space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start text-sm sm:text-base text-gray-300"
                    >
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Payment Method Selection - Shows when plan is selected */}
                {showPaymentOptions === plan.priceId ? (
                  <div className="mb-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white text-center mb-3">
                      Choose Payment Method
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedProvider("stripe")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedProvider === "stripe"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          <GlobeIcon className="w-5 h-5 text-blue-400 mr-2" />
                          <span className="font-semibold text-white text-sm">Stripe</span>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          International & cards
                        </p>
                      </button>
                      <button
                        onClick={() => setSelectedProvider("kora")}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedProvider === "kora"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          <CreditCardIcon className="w-5 h-5 text-green-400 mr-2" />
                          <span className="font-semibold text-white text-sm">Kora</span>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          Local banks & mobile money
                        </p>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => plan.priceId && selectedProvider && handleSubscribe(plan.priceId, selectedProvider)}
                        disabled={isLoading || !selectedProvider || (selectedPlan === plan.priceId && isLoading)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading && selectedPlan === plan.priceId 
                          ? "Processing..." 
                          : `Continue with ${selectedProvider === "stripe" ? "Stripe" : "Kora"}`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePlanSelect(plan.priceId)}
                    disabled={isLoading || (selectedPlan !== null && selectedPlan !== plan.priceId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {plan.priceId ? "Choose Plan" : "Contact Sales"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}