"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Cake, 
  Shirt, 
  Scissors, 
  Briefcase,
  Store,
  Check,
  ArrowRight
} from "lucide-react";
import { Niche } from "@/lib/content-ideas";
import { showToast } from "@/lib/toast";

const niches = [
  {
    id: "home_food_vendor" as Niche,
    name: "Home Food Vendor",
    icon: UtensilsCrossed,
    description: "Selling home-cooked meals",
    emoji: "🍲"
  },
  {
    id: "street_food_seller" as Niche,
    name: "Street Food Seller",
    icon: ShoppingBag,
    description: "Street food & snacks",
    emoji: "🍔"
  },
  {
    id: "baker_cake_vendor" as Niche,
    name: "Baker / Cake Vendor",
    icon: Cake,
    description: "Baked goods & cakes",
    emoji: "🎂"
  },
  {
    id: "fashion_seller" as Niche,
    name: "Fashion Seller",
    icon: Shirt,
    description: "Clothing & accessories",
    emoji: "👗"
  },
  {
    id: "beauty_hair_vendor" as Niche,
    name: "Beauty / Hair Vendor",
    icon: Scissors,
    description: "Hair, beauty & salon",
    emoji: "💇🏽"
  },
  {
    id: "business_coach" as Niche,
    name: "Business / Coach",
    icon: Briefcase,
    description: "Coaching & business tips",
    emoji: "💼"
  },
  {
    id: "online_vendor" as Niche,
    name: "Online Vendor (IG Shop)",
    icon: Store,
    description: "Online store & products",
    emoji: "📱"
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user already has a niche
  useEffect(() => {
    const savedNiche = localStorage.getItem("userNiche");
    if (savedNiche) {
      // User already has a niche, redirect to content ideas
      router.push("/dashboard/content-ideas");
    }
  }, [router]);

  const handleContinue = async () => {
    if (!selectedNiche) {
      showToast.error("Select a niche", "Please choose who you're creating for");
      return;
    }

    setIsSaving(true);
    
    try {
      // Save niche to user settings (you'll implement this API)
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: selectedNiche }),
      });

      if (response.ok) {
        // Store in localStorage as fallback
        localStorage.setItem("userNiche", selectedNiche);
        showToast.success("Niche selected!", "Let's get started");
        router.push("/dashboard/content-ideas");
      } else {
        // Still save to localStorage and continue
        localStorage.setItem("userNiche", selectedNiche);
        router.push("/dashboard/content-ideas");
      }
    } catch (error) {
      // Fallback to localStorage
      localStorage.setItem("userNiche", selectedNiche);
      router.push("/dashboard/content-ideas");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Who are you creating for?
          </h1>
          <p className="text-lg text-gray-600">
            Select your niche to get personalized content ideas
          </p>
        </div>

        {/* Niche Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {niches.map((niche) => {
            const Icon = niche.icon;
            const isSelected = selectedNiche === niche.id;
            
            return (
              <button
                key={niche.id}
                onClick={() => setSelectedNiche(niche.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
                  isSelected
                    ? "border-gray-950 bg-gray-950 text-white shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-gray-950" />
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-white/20" : "bg-gray-100"
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{niche.emoji}</span>
                      <h3 className={`font-bold text-base ${
                        isSelected ? "text-white" : "text-gray-950"
                      }`}>
                        {niche.name}
                      </h3>
                    </div>
                    <p className={`text-sm ${
                      isSelected ? "text-gray-200" : "text-gray-600"
                    }`}>
                      {niche.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedNiche || isSaving}
            className="bg-gray-950 hover:bg-gray-900 text-white px-8 py-6 text-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}
