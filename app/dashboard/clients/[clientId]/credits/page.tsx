"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Credits {
  postsPerMonth: number;
  postsUsed: number;
  revisionsPerPost: number;
  rushRequests: number;
  rushUsed: number;
  resetDate: string;
}

export default function CreditsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credits | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const fetchCredits = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}/credits`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [clientId]);

  if (loading) {
    return <LoadingScreen variant="inline" message="Loading credits..." />;
  }

  if (!credits) {
    return (
      <div className="text-center py-12">
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 text-muted-foreground/70`} />
        <h2 className={`text-xl font-semibold mb-2 text-foreground`}>Credits not found</h2>
        <p className={isDark ? "text-slate-400" : "text-gray-600"}>Credits information is not available for this client.</p>
      </div>
    );
  }

  const postsRemaining = credits.postsPerMonth - credits.postsUsed;
  const postsPercentage = (credits.postsUsed / credits.postsPerMonth) * 100;
  const rushRemaining = credits.rushRequests - credits.rushUsed;
  const isNearLimit = postsRemaining <= 3;
  const isAtLimit = postsRemaining === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className={`text-2xl font-bold text-foreground`}>Content Credits</h1>
      </div>

      {/* Posts Credit Card */}
      <Card className={`shadow-sm ${isAtLimit
        ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40"
        : isNearLimit
        ? "border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/40"
        : isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"
      }`}>
        <CardHeader className={`border-b border-border bg-muted/50`}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 text-foreground`}>
                <CreditCard className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-foreground"}`} />
                Monthly Posts
              </CardTitle>
              <p className={`text-sm mt-1 text-muted-foreground`}>
                Resets on {new Date(credits.resetDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </div>
            {isAtLimit ? (
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                Limit Reached
              </span>
            ) : isNearLimit ? (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                Low Credits
              </span>
            ) : (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                Active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium text-foreground/80`}>Usage</span>
                <span className={`text-sm font-semibold text-foreground`}>
                  {credits.postsUsed} / {credits.postsPerMonth}
                </span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden bg-accent`}>
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtLimit
                      ? "bg-red-500"
                      : isNearLimit
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(postsPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs text-muted-foreground`}>
                  {postsRemaining} posts remaining
                </span>
                <span className={`text-xs text-muted-foreground`}>
                  {Math.round(postsPercentage)}% used
                </span>
              </div>
            </div>

            {isAtLimit && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-red-900/30 border border-red-800" : "bg-red-100 border border-red-200"}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-red-300" : "text-red-900"}`}>Credit limit reached</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-red-400" : "text-red-700"}`}>
                      New posts are paused. Contact the client to upgrade their plan or wait for the next billing cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isNearLimit && !isAtLimit && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-yellow-900/30 border border-yellow-800" : "bg-yellow-100 border border-yellow-200"}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-yellow-300" : "text-yellow-900"}`}>Low credits warning</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>
                      Only {postsRemaining} posts remaining this month. Consider reaching out to the client.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other Credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className={isDark ? "border-b border-slate-700 bg-slate-800/50" : "border-b border-gray-200 bg-gray-50"}>
            <CardTitle className={`text-base font-semibold text-foreground`}>
              Revisions Per Post
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold text-foreground`}>
                {credits.revisionsPerPost}
              </span>
              <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-400" />
            </div>
            <p className={`text-xs mt-2 text-muted-foreground`}>
              Allowed revisions per post
            </p>
          </CardContent>
        </Card>

        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className={isDark ? "border-b border-slate-700 bg-slate-800/50" : "border-b border-gray-200 bg-gray-50"}>
            <CardTitle className={`text-base font-semibold text-foreground`}>
              Rush Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-2xl font-bold text-foreground`}>
                  {rushRemaining}
                </span>
                <span className={`text-sm ml-2 text-muted-foreground`}>
                  / {credits.rushRequests}
                </span>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            </div>
            <p className={`text-xs mt-2 text-muted-foreground`}>
              Rush requests remaining this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Back
        </Button>
        {isAtLimit && (
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              // TODO: Open upgrade modal or contact client
              alert("Contact client to upgrade plan");
            }}
          >
            Upgrade Plan
          </Button>
        )}
      </div>
    </div>
  );
}
