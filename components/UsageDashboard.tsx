"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Zap, Crown } from "lucide-react";
import Link from "next/link";

interface UsageStats {
  usageCount: number;
  limit: number;
  remainingQuota: number;
  usagePercentage: number;
  daysUntilReset: number;
  plan: string;
  isAtLimit: boolean;
  isNearLimit: boolean;
  hasActiveSubscription: boolean;
}

export function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/usage");
      
      if (!response.ok) {
        throw new Error("Failed to fetch usage stats");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching usage stats:", err);
      setError("Failed to load usage information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="w-5 h-5 text-blue-600" />
            Usage This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Usage Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{error || "Unable to load usage information"}</p>
          <Button
            onClick={fetchUsageStats}
            size="sm"
            className="mt-3"
            variant="outline"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { 
    usageCount, 
    limit, 
    remainingQuota, 
    usagePercentage, 
    daysUntilReset, 
    plan,
    isAtLimit,
    isNearLimit,
    hasActiveSubscription
  } = stats;

  const progressColor = isAtLimit 
    ? "bg-red-500" 
    : isNearLimit 
    ? "bg-yellow-500" 
    : "bg-blue-500";

  return (
    <Card className={`rounded-xl border ${
      isAtLimit 
        ? "border-red-200 bg-red-50" 
        : isNearLimit 
        ? "border-yellow-200 bg-yellow-50" 
        : "border-gray-200 bg-white"
    }`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Usage This Month</h3>
              <p className="text-xs text-gray-600">Track your content generation</p>
            </div>
          </div>
          {hasActiveSubscription && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-700">Pro</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Usage Stats */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {usageCount} / {limit === Infinity ? "∞" : limit} posts
              </span>
              <span className={`text-base font-semibold ${
                isAtLimit ? "text-red-600" : isNearLimit ? "text-yellow-600" : "text-gray-900"
              }`}>
                {usagePercentage}%
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              max={100}
              className={`h-2 ${progressColor}`}
            />
          </div>

          {/* Stats Grid - Cleaner */}
          <div className="grid grid-cols-3 gap-3">
            {limit !== Infinity && (
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xl font-bold text-gray-900 mb-1">{remainingQuota}</p>
                <p className="text-xs text-gray-600">Remaining</p>
              </div>
            )}
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xl font-bold text-gray-900 mb-1">{plan}</p>
              <p className="text-xs text-gray-600">Current Plan</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xl font-bold text-gray-900 mb-1">{daysUntilReset}</p>
              <p className="text-xs text-gray-600">Days Until Reset</p>
            </div>
          </div>

          {/* Limit Reached Warning */}
          {isAtLimit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Limit Reached</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {hasActiveSubscription
                  ? `You've used all ${limit} posts for your ${plan} plan this month. Upgrade to continue generating content.`
                  : `You've used all ${limit} free posts this month. Upgrade to a paid plan to continue.`}
              </p>
              <Link href="/pricing" className="block">
                <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  {hasActiveSubscription ? "Upgrade Plan" : "Get Started"}
                </Button>
              </Link>
            </div>
          )}

          {/* Near Limit Warning */}
          {isNearLimit && !isAtLimit && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Running Low</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                You have {remainingQuota} {remainingQuota === 1 ? "post" : "posts"} remaining this month.
              </p>
              <Link href="/pricing" className="block">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          )}

          {/* Free Tier Upgrade CTA */}
          {!hasActiveSubscription && !isAtLimit && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Upgrade for More</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Get 100+ posts per month with a paid plan
              </p>
              <Link href="/pricing" className="block">
                <Button 
                  size="sm" 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  View Plans
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
