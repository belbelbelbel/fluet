"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
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
  totalViews?: number;
  totalLikes?: number;
  totalShares?: number;
  totalComments?: number;
  totalEngagement: number | null;
  averageEngagementRate: number | null;
  topPerformingPost: {
    id: number;
    platform: string;
    content: string;
    engagementRate: number;
  } | null;
  platformBreakdown: Array<{
    platform: string;
    posts: number;
    engagement: number | null;
    engagementRate: number | null;
  }>;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
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
    return <LoadingScreen variant="inline" message="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className={`w-12 h-12 mx-auto mb-4 text-muted-foreground/70`} />
        <h2 className={`text-xl font-semibold mb-2 text-foreground`}>No activity yet</h2>
        <p className={"text-muted-foreground"}>
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
            <h1 className={`text-2xl font-bold text-foreground`}>
              Client Analytics
            </h1>
            <p className={`text-sm text-muted-foreground`}>
              Scheduled activity plus synced Twitter/Instagram engagement
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
                timeRange === range ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""
              }
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={"border-border bg-card"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold text-foreground`}>
                {analytics.totalPosts}
              </span>
              <span className={`text-sm text-muted-foreground`}>
                {analytics.postsThisMonth} this month
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.postsThisMonth >= analytics.postsLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-xs text-muted-foreground`}>
                {Math.abs(analytics.postsThisMonth - analytics.postsLastMonth)} vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={"border-border bg-card"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-5 h-5 ${"text-green-600 dark:text-green-400"}`} />
              <span className={`text-2xl font-bold text-foreground`}>
                {analytics.postedPosts}
              </span>
            </div>
            <p className={`text-xs mt-2 text-muted-foreground`}>
              Posts marked as published
            </p>
          </CardContent>
        </Card>

        <Card className={"border-border bg-card"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Top Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${"text-foreground dark:text-purple-400"}`} />
              <span className={`text-2xl font-bold capitalize text-foreground`}>
                {analytics.topPlatform ?? "—"}
              </span>
            </div>
            <p className={`text-xs mt-2 text-muted-foreground`}>
              Most scheduled posts by platform
            </p>
          </CardContent>
        </Card>

        <Card className={"border-border bg-card"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.engagementMetricsAvailable ? (
              <>
                <span className={`text-2xl font-bold tabular-nums text-foreground`}>
                  {(analytics.totalEngagement ?? 0).toLocaleString()}
                </span>
                <p className={`text-xs mt-2 text-muted-foreground`}>
                  {analytics.averageEngagementRate != null
                    ? `${analytics.averageEngagementRate}% avg rate`
                    : "Likes + shares + comments"}
                </p>
              </>
            ) : (
              <>
                <span className={`text-2xl font-bold text-muted-foreground/70`}>—</span>
                <p className={`text-xs mt-2 text-muted-foreground`}>
                  Syncs after Twitter/IG auto-post
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics.platformBreakdown.length > 0 && (
        <Card className={"border-border bg-card"}>
          <CardHeader className={"border-b border-border bg-muted/50"}>
            <CardTitle className={`text-lg font-semibold text-foreground`}>
              Posts by Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {analytics.platformBreakdown.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-medium capitalize text-foreground`}>
                    {platform.platform}
                  </span>
                  <span className={`text-sm text-right text-muted-foreground`}>
                    {platform.posts} posts
                    {platform.engagement != null
                      ? ` · ${platform.engagement.toLocaleString()} eng.`
                      : ""}
                    {platform.engagementRate != null
                      ? ` · ${platform.engagementRate}%`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={"border-border bg-card"}>
        <CardHeader className={"border-b border-border bg-muted/50"}>
          <CardTitle className={`text-lg font-semibold text-foreground`}>
            Engagement & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {analytics.engagementMetricsAvailable ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Views", value: analytics.totalViews ?? 0 },
                  { label: "Likes", value: analytics.totalLikes ?? 0 },
                  { label: "Shares", value: analytics.totalShares ?? 0 },
                  { label: "Comments", value: analytics.totalComments ?? 0 },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`rounded-lg p-3 ${"bg-gray-50 dark:bg-slate-700/50"}`}
                  >
                    <p className={`text-xs text-muted-foreground`}>{m.label}</p>
                    <p className={`text-lg font-semibold tabular-nums text-foreground`}>
                      {m.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              {analytics.topPerformingPost && (
                <div
                  className={`rounded-lg p-4 ${"bg-gray-50 dark:bg-slate-700/40"}`}
                >
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 text-muted-foreground`}>
                    Top performing · {analytics.topPerformingPost.platform} ·{" "}
                    {analytics.topPerformingPost.engagementRate}%
                  </p>
                  <p className={`text-sm text-foreground`}>
                    {analytics.topPerformingPost.content}
                    {analytics.topPerformingPost.content.length >= 160 ? "…" : ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <FeatureComingSoon
              icon={BarChart3}
              title="No engagement synced yet"
              description="Connect Twitter or Instagram, auto-post for this client, then metrics appear here on each cron run."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
