"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Check,
  ArrowRight,
  Sparkles,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";
import { showToast } from "@/lib/toast";

type Step = "welcome" | "create_client" | "niche" | "plan";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [createdClientId, setCreatedClientId] = useState<number | null>(null);
  const [primaryIndustry, setPrimaryIndustry] = useState("");
  const [nicheDescription, setNicheDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasClients, setHasClients] = useState<boolean | null>(null);

  // Check if user already has clients → skip to dashboard
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/clients", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const list = data.clients || [];
          setHasClients(list.length > 0);
          if (list.length > 0) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        setHasClients(false);
      }
    };
    check();
  }, [router]);

  const handleCreateClient = async () => {
    const name = clientName.trim();
    if (!name) {
      showToast.error("Name required", "Enter your first client's name");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: clientEmail.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        showToast.error("Couldn't create client", err?.error || "Please try again");
        return;
      }
      const data = await response.json();
      const client = data?.client;
      if (client?.id) setCreatedClientId(client.id);
      showToast.success("Client created!", "Now set their content niche.");
      setStep("niche");
    } catch {
      showToast.error("Error", "Failed to create client. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToDashboard = () => {
    router.replace("/dashboard");
  };

  if (hasClients === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (hasClients) {
    return null; // redirecting
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {step === "welcome" && (
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-950 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Welcome to Revvy
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Get started by adding your first client. You can always add more later.
              </p>
              <Button
                onClick={() => setStep("create_client")}
                className="w-full bg-gray-950 hover:bg-gray-900 text-white py-6 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                Create first client
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "create_client" && (
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-foreground/80" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Create your first client</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Add a name and optional email (for approval notifications).
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="client-name">Client name</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Co"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Email (optional)</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateClient}
                  disabled={!clientName.trim() || isSaving}
                  className="flex-1 bg-gray-950 hover:bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "Create client"}
                  <Check className="w-4 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "niche" && (
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Content niche for {clientName || "your client"}</h2>
              <p className="text-muted-foreground text-sm mb-6">
                This helps us show relevant content ideas. You can change it later in Brand Voice.
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <Label>Primary Industry</Label>
                  <select
                    value={primaryIndustry}
                    onChange={(e) => setPrimaryIndustry(e.target.value)}
                    className="mt-1 w-full px-4 py-2 border border-border rounded-lg bg-white"
                  >
                    <option value="">Select industry</option>
                    <option value="food_beverage">Food & Beverage</option>
                    <option value="fashion_beauty">Fashion & Beauty</option>
                    <option value="coaching_consulting">Coaching & Consulting</option>
                    <option value="retail_ecommerce">Retail & E-commerce</option>
                    <option value="health_fitness">Health & Fitness</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="creative_services">Creative Services</option>
                    <option value="tech_startups">Tech & Startups</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {(primaryIndustry === "other" || ["health_fitness", "real_estate", "creative_services", "tech_startups"].includes(primaryIndustry)) && (
                  <div>
                    <Label>Specific Niche (e.g. Online Fitness Coach for Women)</Label>
                    <Input
                      value={nicheDescription}
                      onChange={(e) => setNicheDescription(e.target.value)}
                      placeholder="Describe your client's business"
                      className="mt-1"
                    />
                  </div>
                )}
                {primaryIndustry && !["other", "health_fitness", "real_estate", "creative_services", "tech_startups"].includes(primaryIndustry) && (
                  <div>
                    <Label>Specific Niche (optional)</Label>
                    <Input
                      value={nicheDescription}
                      onChange={(e) => setNicheDescription(e.target.value)}
                      placeholder="e.g. Jollof specialist, Wedding cakes"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("create_client")}
                  className="flex-1 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={async () => {
                    if (!createdClientId) {
                      setStep("plan");
                      return;
                    }
                    const { primaryIndustryToNiche } = await import("@/lib/content-ideas");
                    const mapped = primaryIndustry ? primaryIndustryToNiche(primaryIndustry) : "custom";
                    const needsDesc = mapped === "custom";
                    if (needsDesc && !nicheDescription.trim()) {
                      showToast.error("Required", "Please describe the specific niche");
                      return;
                    }
                    setIsSaving(true);
                    try {
                      const bvRes = await fetch(`/api/clients/${createdClientId}/brand-voice`, {
                        credentials: "include",
                      });
                      const bvData = (bvRes.ok && (await bvRes.json()))?.brandVoice || {};
                      const niche = mapped === "custom" ? "custom" : mapped;
                      await fetch(`/api/clients/${createdClientId}/brand-voice`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          ...bvData,
                          niche,
                          primaryIndustry: primaryIndustry || undefined,
                          nicheDescription: nicheDescription.trim() || bvData.nicheDescription,
                        }),
                      });
                      showToast.success("Niche saved!", "Content ideas ready");
                      setStep("plan");
                    } catch {
                      showToast.error("Couldn't save", "You can set it in Brand Voice later");
                      setStep("plan");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={!primaryIndustry || isSaving}
                  className="flex-1 bg-gray-950 hover:bg-gray-900 text-white rounded-xl font-semibold"
                >
                  {isSaving ? "Saving..." : "Continue"}
                </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("plan")}
                  className="text-sm text-muted-foreground hover:text-gray-700 self-center"
                >
                  Skip for now
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "plan" && (
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-foreground/80" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Pick a plan (optional)</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Choose a plan that fits your team. You can start with the dashboard and upgrade anytime.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                  className="w-full rounded-xl flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  View pricing
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-gray-950 hover:bg-gray-900 text-white py-6 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
