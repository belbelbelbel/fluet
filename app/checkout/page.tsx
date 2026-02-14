"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, ArrowLeftIcon, CreditCardIcon, ShieldIcon } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { showToast } from "@/lib/toast";
import { Navbar } from "../components/Navbar";

type PaymentProvider = "stripe" | "kora";

const pricingPlans = [
  {
    id: "basic",
    name: "Basic plan",
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
  const { isSignedIn, user } = useUser();
  
  const planId = searchParams.get("plan") || "basic";
  const billingCycle = (searchParams.get("billing") || "monthly") as "monthly" | "yearly";
  
  const [selectedPlan, setSelectedPlan] = useState(
    pricingPlans.find(p => p.id === planId) || pricingPlans[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Payment form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("NG");

  useEffect(() => {
    if (!isSignedIn) {
      showToast.error("Sign in required", "Please sign in to continue with checkout");
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/checkout")}`);
    }
  }, [isSignedIn, router]);

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

  if (!isSignedIn) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/pricing")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm">Back to pricing</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Selection */}
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose your plan</h2>
                  <div className="space-y-3">
                    {pricingPlans.map((plan) => {
                      const isSelected = selectedPlan.id === plan.id;
                      const planPrice = billingCycle === "yearly" && plan.price !== "Custom"
                        ? getYearlyPrice(plan.price)
                        : plan.price;
                      
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-purple-600 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{plan.name}</div>
                              <div className="text-sm text-gray-600">
                                {plan.price === "Custom" ? "Custom pricing" : `₦${parseInt(planPrice).toLocaleString('en-NG')}/${billingCycle === "yearly" ? "year" : "month"}`}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-purple-600 bg-purple-600"
                                : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Provider Selection */}
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pay with</h2>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setSelectedProvider("stripe")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedProvider === "stripe"
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Stripe</div>
                      <div className="text-xs text-gray-600">Credit & Debit Cards</div>
                    </button>
                    <button
                      onClick={() => setSelectedProvider("kora")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedProvider === "kora"
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Kora</div>
                      <div className="text-xs text-gray-600">Local Payment Methods</div>
                    </button>
                  </div>

                  {/* Stripe Payment Form */}
                  {selectedProvider === "stripe" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="1234 1234 1234 1234"
                            maxLength={19}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <CreditCardIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVC
                          </label>
                          <input
                            type="text"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="CVC"
                            maxLength={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="NG">Nigeria</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold"
                      >
                        {isLoading ? "Processing..." : "Complete Purchase"}
                      </Button>
                    </form>
                  )}

                  {/* Kora Payment - Just button */}
                  {selectedProvider === "kora" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You will be redirected to Kora to complete your payment securely.
                        </p>
                      </div>
                      
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold"
                      >
                        {isLoading ? "Processing..." : "Continue to Kora"}
                      </Button>
                    </form>
                  )}

                  {!selectedProvider && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Please select a payment method above
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      By providing your card information, you allow Revvy to charge your card for future payments in accordance with our terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Plan Details */}
            <div className="lg:col-span-1">
              <Card className="border border-gray-200 sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan details</h2>
                  
                  <div className="mb-6">
                    <div className="font-semibold text-gray-900">{selectedPlan.name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {billingCycle === "yearly" ? "Annual" : "Monthly"} Subscription
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Renews {new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {selectedPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{selectedPlan.name}</span>
                      <span className="font-semibold text-gray-900">
                        {selectedPlan.price === "Custom" 
                          ? "Custom" 
                          : `₦${parseInt(displayPrice).toLocaleString('en-NG')}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total Due Today</span>
                      <span className="text-xl font-bold text-gray-900">
                        {selectedPlan.price === "Custom" 
                          ? "Contact Sales" 
                          : `₦${parseInt(displayPrice).toLocaleString('en-NG')}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-2">
                    <ShieldIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Secure payment processing
                    </span>
                  </div>
                </CardContent>
              </Card>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
