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

type Step = "welcome" | "create_client" | "plan";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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
      showToast.success("Client created!", "You can add more from the dashboard.");
      setStep("plan");
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
        <div className="animate-pulse text-gray-500">Loading...</div>
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
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Welcome to Revvy
              </h1>
              <p className="text-gray-600 text-center mb-8">
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
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-gray-700" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your first client</h2>
              <p className="text-gray-600 text-sm mb-6">
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

        {step === "plan" && (
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-gray-700" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Pick a plan (optional)</h2>
              <p className="text-gray-600 text-sm mb-6">
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
