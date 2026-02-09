"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

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
      setStatus("error");
      setMessage("Please sign in to connect YouTube");
      return;
    }

    // Exchange code for tokens
    handleTokenExchange(code);
  }, [searchParams, userId]);

  const handleTokenExchange = async (code: string) => {
    try {
      const response = await fetch("/api/youtube/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to exchange token");
      }

      setStatus("success");
      setMessage("YouTube connected successfully!");
      
      // Redirect to settings or dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 2000);
    } catch (error: any) {
      console.error("Token exchange error:", error);
      setStatus("error");
      setMessage(error.message || "Failed to connect YouTube");
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
                Connecting YouTube...
              </h2>
              <p className="text-gray-600">
                Please wait while we connect your YouTube account
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-950 mb-2">
                YouTube Connected!
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
