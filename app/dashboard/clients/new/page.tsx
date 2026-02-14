"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function CreateClientPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast.error("Client name required", "Please enter a client name");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          logoUrl: formData.logoUrl.trim() || undefined,
          userId: userId, // Include userId as fallback
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[Create Client] Non-JSON response:", text.substring(0, 200));
        showToast.error(
          "Server Error",
          "The server returned an unexpected response. Please try again or refresh the page."
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        showToast.success("Client created", "Redirecting to client dashboard...");
        
        // Dispatch event to refresh client selector
        window.dispatchEvent(new CustomEvent('clientCreated', { detail: data.client }));
        
        router.push(`/dashboard/clients/${data.client.id}`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to create client" }));
        const errorMessage = errorData.error || errorData.details || "Failed to create client. Please try again.";
        
        // Handle 401 specifically
        if (response.status === 401) {
          showToast.error(
            "Authentication required", 
            errorData.details || "Please sign in to create clients. If you're already signed in, please try refreshing the page."
          );
        } else {
          showToast.error("Failed to create client", errorMessage);
        }
        console.error("Client creation error:", errorData);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      showToast.error("Error", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-4 sm:py-6 lg:py-8 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className={`p-2 transition-all duration-200 ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-gray-700 hover:text-gray-950 hover:bg-gray-100"}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            Create New Client
          </h1>
        </div>

        <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
          <CardHeader className={`${isDark ? "border-slate-700" : ""} px-4 sm:px-6 pt-4 sm:pt-6`}>
            <CardTitle className={`text-lg sm:text-xl ${isDark ? "text-white" : "text-gray-950"}`}>
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"}`}
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label
                  htmlFor="logoUrl"
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}
                >
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"}`}
                  placeholder="https://example.com/logo.png"
                />
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Enter a URL to the client&apos;s logo image
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className={`flex-1 sm:flex-none transition-all duration-200 py-2.5 sm:py-2 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"}`}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200 shadow-sm hover:shadow-md py-2.5 sm:py-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-2" />
                      Create Client
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
