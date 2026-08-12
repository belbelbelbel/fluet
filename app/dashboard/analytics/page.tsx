"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";
import {
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Twitter,
  Instagram,
  Linkedin,
  Music,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

interface AnalyticsData {
  contentActivity: {
    totalContent: number;
    scheduledPosts: number;
    thisWeekContent: number;
    topPlatform: string | null;
    tasksOpen?: number;
  };
  contentVolume: { date: string; generated: number; scheduled: number }[];
  activityPlatformStats: { platform: string; posts: number }[];
  engagementMetricsAvailable: boolean;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number | null;
  platformStats: {
    platform: string;
    posts: number;
    views: number;
    engagement: number;
  }[];
}

const defaultData: AnalyticsData = {
  contentActivity: {
    totalContent: 0,
    scheduledPosts: 0,
    thisWeekContent: 0,
    topPlatform: null,
    tasksOpen: 0,
  },
  contentVolume: [],
  activityPlatformStats: [],
  engagementMetricsAvailable: false,
  totalViews: 0,
  totalLikes: 0,
  totalShares: 0,
  totalComments: 0,
  engagementRate: null,
  platformStats: [],
};

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setData({ ...defaultData, ...analyticsData });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, fetchAnalytics]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "linkedin":
        return <Linkedin className="w-5 h-5" />;
      case "tiktok":
        return <Music className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const activityMetrics = [
    {
      title: "Total Content",
      value: data.contentActivity.totalContent.toLocaleString(),
      icon: FileText,
    },
    {
      title: "Scheduled Posts",
      value: data.contentActivity.scheduledPosts.toLocaleString(),
      icon: Clock,
    },
    {
      title: "This Week",
      value: data.contentActivity.thisWeekContent.toLocaleString(),
      icon: Sparkles,
    },
    {
      title: "Top Platform",
      value: data.contentActivity.topPlatform
        ? data.contentActivity.topPlatform.charAt(0).toUpperCase() +
          data.contentActivity.topPlatform.slice(1)
        : "—",
      icon: BarChart3,
    },
  ];

  const engagementMetrics = [
    { title: "Total Views", value: data.totalViews.toLocaleString(), icon: Eye },
    { title: "Total Likes", value: data.totalLikes.toLocaleString(), icon: Heart },
    { title: "Total Shares", value: data.totalShares.toLocaleString(), icon: Share2 },
    {
      title: "Total Comments",
      value: data.totalComments.toLocaleString(),
      icon: MessageSquare,
    },
  ];

  return (
    <div className={`space-y-6 sm:space-y-8 pb-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto transition-colors duration-300 bg-background`}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 sm:pb-8 border-b-2 transition-colors duration-300 border-border`}>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 text-foreground`}>Analytics Dashboard</h1>
          <p className={"text-muted-foreground"}>
            Live activity from your workspace — social engagement connects next
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                timeRange === range
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-white border-[0.5px] border-border text-gray-700 hover:bg-accent/50 dark:bg-slate-800 dark:border-[0.5px] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className={`text-xl font-bold mb-6 text-foreground`}>
          Your Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {activityMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={index}
                className={`border-2 rounded-xl transition-colors duration-300 bg-card border-border`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className={`text-sm font-bold uppercase tracking-wide text-foreground/80`}>
                    {metric.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${
                    "text-gray-700 bg-gray-100 dark:text-slate-300 dark:bg-slate-700"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-foreground`}>
                    {loading ? (
                      <div className={`h-10 w-28 rounded animate-pulse bg-accent`} />
                    ) : (
                      metric.value
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className={`text-xl font-bold mb-6 text-foreground`}>
          Engagement Metrics
        </h2>
        {data.engagementMetricsAvailable ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {engagementMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <Card
                    key={index}
                    className={`border-2 rounded-xl transition-colors duration-300 bg-card border-border`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className={`text-sm font-bold uppercase tracking-wide text-foreground/80`}>
                        {metric.title}
                      </CardTitle>
                      <div className={`p-3 rounded-xl ${
                        "text-gray-700 bg-gray-100 dark:text-slate-300 dark:bg-slate-700"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold text-foreground`}>
                        {loading ? (
                          <div className={`h-10 w-28 rounded animate-pulse bg-accent`} />
                        ) : (
                          metric.value
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className={`border-2 rounded-xl transition-colors duration-300 bg-card border-border`}>
              <CardHeader className="pb-4">
                <CardTitle className={"text-foreground"}>
                  Engagement Rate
                </CardTitle>
                <CardDescription className={"text-muted-foreground"}>
                  From connected platform analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold text-foreground`}>
                  {data.engagementRate != null ? `${data.engagementRate}%` : "—"}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <FeatureComingSoon
            icon={BarChart3}
            title="No engagement synced yet"
            description="Connect Twitter in Settings and let scheduled posts auto-publish. Tweet metrics sync into analytics on each cron run."
          />
        )}
      </div>

      {data.engagementMetricsAvailable && (
        <div>
          <h2 className={`text-xl font-bold mb-6 text-foreground`}>
            Platform Performance
          </h2>
          <Card className={`border-2 rounded-xl transition-colors duration-300 bg-card border-border`}>
            <CardHeader className="pb-4">
              <CardTitle className={"text-foreground"}>
                Performance by Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.platformStats.map((platform, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 sm:p-6 rounded-xl border ${
                      "bg-gray-50 border-gray-200 dark:bg-slate-700/50 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                        "bg-white border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                      }`}>
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <p className={`font-bold capitalize text-foreground`}>
                          {platform.platform}
                        </p>
                        <p className={`text-sm text-muted-foreground`}>
                          {platform.posts} posts • {platform.views.toLocaleString()} views
                        </p>
                      </div>
                    </div>
                    <p className={`text-xl font-bold text-foreground`}>
                      {platform.engagement}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity by platform (real scheduled posts) */}
      {data.activityPlatformStats.length > 0 && (
        <div>
          <h2 className={`text-xl font-bold mb-6 text-foreground`}>
            Scheduled by platform
          </h2>
          <Card
            className={`border-2 rounded-xl transition-colors duration-300 bg-card border-border`}
          >
            <CardContent className="pt-6 space-y-3">
              {data.activityPlatformStats.map((platform) => {
                const max = Math.max(
                  ...data.activityPlatformStats.map((p) => p.posts),
                  1
                );
                return (
                  <div key={platform.platform} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`capitalize font-medium flex items-center gap-2 text-foreground`}
                      >
                        {getPlatformIcon(platform.platform)}
                        {platform.platform}
                      </span>
                      <span className={"text-muted-foreground"}>
                        {platform.posts}
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden bg-accent`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(platform.posts / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className={`text-xl font-bold mb-6 text-foreground`}>
          Performance Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            className={`border-2 rounded-xl bg-card border-border`}
          >
            <CardHeader className="pb-4">
              <CardTitle className={"text-foreground"}>
                Content volume
              </CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Generated vs scheduled in this range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div
                  className={`h-40 rounded-xl animate-pulse bg-accent`}
                />
              ) : (
                <VolumeChart series={data.contentVolume} />
              )}
            </CardContent>
          </Card>

          <Card
            className={`border-2 rounded-xl bg-card border-border`}
          >
            <CardHeader className="pb-4">
              <CardTitle className={"text-foreground"}>
                Engagement trends
              </CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                From connected social analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.engagementMetricsAvailable ? (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs text-muted-foreground`}>
                        Views
                      </p>
                      <p className={`text-2xl font-bold tabular-nums text-foreground`}>
                        {data.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs text-muted-foreground`}>
                        Engagement rate
                      </p>
                      <p className={`text-2xl font-bold tabular-nums text-foreground`}>
                        {data.engagementRate != null ? `${data.engagementRate}%` : "—"}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs text-muted-foreground/70`}>
                    Synced from Twitter after auto-post (cron). More platforms next.
                  </p>
                </div>
              ) : (
                <FeatureComingSoon
                  compact
                  icon={BarChart3}
                  title="Twitter engagement sync ready"
                  description="Connect Twitter, auto-post scheduled tweets, then metrics appear here on each cron run."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VolumeChart({
  series,
}: {
  series: { date: string; generated: number; scheduled: number }[];
}) {
  if (!series.length) {
    return (
      <p className={`text-sm py-10 text-center text-muted-foreground`}>
        No activity in this range yet.
      </p>
    );
  }

  // Sample bars for readability on long ranges
  const step = series.length > 30 ? Math.ceil(series.length / 24) : 1;
  const bars = series.filter((_, i) => i % step === 0 || i === series.length - 1);
  const max = Math.max(...bars.map((b) => b.generated + b.scheduled), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-40">
        {bars.map((day) => {
          const total = day.generated + day.scheduled;
          const h = Math.max(4, Math.round((total / max) * 100));
          const genShare = total ? (day.generated / total) * 100 : 0;
          return (
            <div
              key={day.date}
              className="flex-1 min-w-0 flex flex-col justify-end group relative"
              title={`${day.date}: ${day.generated} generated, ${day.scheduled} scheduled`}
            >
              <div
                className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end"
                style={{ height: `${h}%` }}
              >
                <div
                  className="w-full bg-primary/80"
                  style={{ height: `${genShare}%`, minHeight: day.generated ? 2 : 0 }}
                />
                <div
                  className={`w-full ${"bg-gray-400 dark:bg-slate-500"}`}
                  style={{
                    height: `${100 - genShare}%`,
                    minHeight: day.scheduled ? 2 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary/80" />
          <span className={"text-muted-foreground"}>Generated</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-sm ${"bg-gray-400 dark:bg-slate-500"}`}
          />
          <span className={"text-muted-foreground"}>Scheduled</span>
        </span>
        <span className={`ml-auto text-muted-foreground/70`}>
          <Calendar className="w-3 h-3 inline mr-1" />
          {series[0]?.date?.slice(5)} → {series[series.length - 1]?.date?.slice(5)}
        </span>
      </div>
    </div>
  );
}
