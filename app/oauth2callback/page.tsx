"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "twitter" | "instagram">("youtube");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // Detect platform from state or default to YouTube
    if (state?.includes("twitter")) {
      setPlatform("twitter");
    } else if (state?.includes("instagram")) {
      setPlatform("instagram");
    }

    if (error) {
      setStatus("error");
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received");
      return;
    }

    if (!userId) {
      const platformName = platform === "twitter" ? "Twitter" : platform === "instagram" ? "Instagram" : "YouTube";
      setStatus("error");
      setMessage(`Please sign in to connect ${platformName}`);
      return;
    }

    // Exchange code for tokens
    handleTokenExchange(code);
  }, [searchParams, userId, platform]);

  const handleTokenExchange = async (code: string) => {
    try {
      let endpoint = "/api/youtube/callback";
      let platformName = "YouTube";
      
      if (platform === "twitter") {
        endpoint = "/api/twitter/callback";
        platformName = "Twitter";
      } else if (platform === "instagram") {
        endpoint = "/api/instagram/callback";
        platformName = "Instagram";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to exchange token`);
      }

      setStatus("success");
      setMessage(`${platformName} connected successfully!`);
      
      // Redirect to settings or dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 2000);
    } catch (error: unknown) {
      console.error("Token exchange error:", error);
      setStatus("error");
      const platformName = platform === "twitter" ? "Twitter" : platform === "instagram" ? "Instagram" : "YouTube";
      setMessage(error instanceof Error ? error.message : `Failed to connect ${platformName}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-gray-200 rounded-2xl">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-gray-950 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-950 mb-2">
                Connecting {platform === "twitter" ? "Twitter" : platform === "instagram" ? "Instagram" : "YouTube"}...
              </h2>
              <p className="text-gray-600">
                Please wait while we connect your {platform === "twitter" ? "Twitter" : platform === "instagram" ? "Instagram" : "YouTube"} account
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-950 mb-2">
                {platform === "twitter" ? "Twitter" : platform === "instagram" ? "Instagram" : "YouTube"} Connected!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting to settings...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-950 mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button
                onClick={() => router.push("/dashboard/settings")}
                className="bg-gray-950 hover:bg-gray-900 text-white"
              >
                Go to Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-gray-200 rounded-2xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-gray-950 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-950 mb-2">
              Loading...
            </h2>
          </CardContent>
        </Card>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
