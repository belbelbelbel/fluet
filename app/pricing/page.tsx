"use client";
import { Button } from "@/components/ui/button";
import { CheckIcon, StarIcon, Bolt, ShieldIcon, ArrowRightIcon, LayersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const pricingPlans = [
  {
    id: "basic",
    name: "Basic plan",
    description: "Perfect for freelance social media managers",
    price: "10000",
    priceDisplay: "₦10,000",
    priceId: "price_1PyFKGBibz3ZDixDAaJ3HO74",
    popular: false,
    icon: Bolt,
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
    description: "For small agencies managing 3-10 clients",
    price: "25000",
    priceDisplay: "₦25,000",
    priceId: "price_1PyFN0Bibz3ZDixDqm9eYL8W",
    popular: true,
    badge: "Best Value",
    icon: LayersIcon,
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
    description: "For agencies and large teams",
    price: "Custom",
    priceDisplay: "Custom",
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

// Unused - commented out
// const allFeatures = [
//   { name: "AI-generated posts per month", basic: "100", pro: "500", enterprise: "Unlimited" },
//   { name: "Social media platforms", basic: "2", pro: "4", enterprise: "All" },
//   { name: "Content templates", basic: "Basic", pro: "Advanced", enterprise: "Custom" },
//   { name: "We post for you automatically", basic: "❌", pro: "✅", enterprise: "✅" },
//   { name: "Analytics dashboard", basic: "Basic", pro: "Advanced", enterprise: "Enterprise" },
//   { name: "Bulk generation", basic: "❌", pro: "✅", enterprise: "✅" },
//   { name: "API access", basic: "❌", pro: "❌", enterprise: "✅" },
//   { name: "Support", basic: "Email", pro: "Priority", enterprise: "Dedicated" },
// ];

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleGetStarted = (planId: string, priceId: string | null) => {
    if (!priceId) {
      // Enterprise plan - contact sales
      window.location.href = "mailto:sales@revvy.com?subject=Enterprise Plan Inquiry";
      return;
    }
    // Redirect to checkout page with plan info
    router.push(`/checkout?plan=${planId}&billing=${billingCycle}`);
  };

  const getYearlyPrice = (monthlyPrice: string) => {
    if (monthlyPrice === "Custom") return "Custom";
    const price = parseInt(monthlyPrice);
    // 10 months for yearly (save 2 months)
    return (price * 10).toString();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Header Section - Reference Style */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 border border-purple-200 rounded-full mb-6">
              <span className="text-sm text-purple-900 font-medium">Features</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple Pricing, Powerful Features
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Simple, transparent pricing that grows with you. Try any plan free for 30 days.
            </p>

            {/* Billing Toggle - Reference Style */}
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

          {/* Pricing Cards - Reference Style */}
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
                              {plan.priceDisplay || `₦${parseInt(displayPrice).toLocaleString('en-NG')}`}
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

                    {/* Features List - Reference Style */}
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

                    {/* CTA Button - Simple Get Started */}
                    <Button
                      onClick={() => handleGetStarted(plan.id, plan.priceId)}
                      className={`w-full py-3 font-semibold rounded-xl transition-all ${
                        isPopular
                          ? "bg-white text-purple-900 hover:bg-white/90"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {plan.priceId ? "Get Started" : "Contact Sales"}
                      {plan.priceId && <ArrowRightIcon className="w-4 h-4 ml-2" />}
                    </Button>
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
              <Bolt className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
              <p className="text-sm text-gray-600">No long-term contracts</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
              <StarIcon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">14-Day Money Back</h3>
              <p className="text-sm text-gray-600">Risk-free guarantee</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
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
                <div key={idx} className="p-5 bg-white rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
