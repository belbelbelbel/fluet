"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface AnalyticsData {
  totalPosts: number;
  postedPosts: number;
  postsThisMonth: number;
  postsLastMonth: number;
  topPlatform: string | null;
  engagementMetricsAvailable: boolean;
  platformBreakdown: Array<{
    platform: string;
    posts: number;
  }>;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    if (!clientId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/clients/${clientId}/analytics?range=${timeRange}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [clientId, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? "text-purple-400" : "text-purple-600"}`} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>No activity yet</h2>
        <p className={isDark ? "text-slate-400" : "text-gray-600"}>
          Post counts will appear here once you schedule content for this client.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Client Analytics
            </h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Post activity is tracked — engagement metrics coming soon
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
              }
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {analytics.totalPosts}
              </span>
              <span className={`text-sm ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                {analytics.postsThisMonth} this month
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.postsThisMonth >= analytics.postsLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {Math.abs(analytics.postsThisMonth - analytics.postsLastMonth)} vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {analytics.postedPosts}
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              Posts marked as published
            </p>
          </CardContent>
        </Card>

        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Top Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
              <span className={`text-2xl font-bold capitalize ${isDark ? "text-white" : "text-gray-900"}`}>
                {analytics.topPlatform ?? "—"}
              </span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              Most scheduled posts by platform
            </p>
          </CardContent>
        </Card>

        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${isDark ? "text-slate-500" : "text-gray-400"}`}>—</span>
            <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {analytics.platformBreakdown.length > 0 && (
        <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
          <CardHeader className={isDark ? "border-b border-slate-700 bg-slate-800/50" : "border-b border-gray-200 bg-gray-50"}>
            <CardTitle className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Posts by Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {analytics.platformBreakdown.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between">
                  <span className={`text-sm font-medium capitalize ${isDark ? "text-white" : "text-gray-900"}`}>
                    {platform.platform}
                  </span>
                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                    {platform.posts} posts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"}>
        <CardHeader className={isDark ? "border-b border-slate-700 bg-slate-800/50" : "border-b border-gray-200 bg-gray-50"}>
          <CardTitle className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            Engagement & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <FeatureComingSoon
            isDark={isDark}
            icon={BarChart3}
            title="Real-time analytics coming soon"
            description="Engagement rates, top-performing posts, and monthly trend charts will appear here once platform analytics are connected."
          />
        </CardContent>
      </Card>
    </div>
  );
}
