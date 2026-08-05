"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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
  };
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
  },
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
    <div className={`space-y-6 sm:space-y-8 pb-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 sm:pb-8 border-b-2 transition-colors duration-300 ${
        isDark ? "border-slate-700" : "border-gray-200"
      }`}>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>Analytics Dashboard</h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Your content activity is tracked now — engagement metrics from social platforms are coming soon
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                timeRange === range
                  ? "bg-purple-600 text-white shadow-md"
                  : isDark
                  ? "bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-950"}`}>
          Your Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {activityMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={index}
                className={`border-2 rounded-xl transition-colors duration-300 ${
                  isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className={`text-sm font-bold uppercase tracking-wide ${
                    isDark ? "text-slate-300" : "text-gray-700"
                  }`}>
                    {metric.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${
                    isDark ? "text-slate-300 bg-slate-700" : "text-gray-700 bg-gray-100"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
                    {loading ? (
                      <div className={`h-10 w-28 rounded animate-pulse ${
                        isDark ? "bg-slate-700" : "bg-gray-200"
                      }`} />
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
        <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-950"}`}>
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
                    className={`border-2 rounded-xl transition-colors duration-300 ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className={`text-sm font-bold uppercase tracking-wide ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>
                        {metric.title}
                      </CardTitle>
                      <div className={`p-3 rounded-xl ${
                        isDark ? "text-slate-300 bg-slate-700" : "text-gray-700 bg-gray-100"
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
                        {loading ? (
                          <div className={`h-10 w-28 rounded animate-pulse ${
                            isDark ? "bg-slate-700" : "bg-gray-200"
                          }`} />
                        ) : (
                          metric.value
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className={`border-2 rounded-xl transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-4">
                <CardTitle className={isDark ? "text-white" : "text-gray-950"}>
                  Engagement Rate
                </CardTitle>
                <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
                  From connected platform analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
                  {data.engagementRate != null ? `${data.engagementRate}%` : "—"}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <FeatureComingSoon
            isDark={isDark}
            icon={BarChart3}
            title="Real-time analytics coming soon"
            description="Views, likes, shares, and engagement rates will appear here once social platform analytics are connected. Your post counts above reflect real activity in Revvy."
          />
        )}
      </div>

      {data.engagementMetricsAvailable && (
        <div>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-950"}`}>
            Platform Performance
          </h2>
          <Card className={`border-2 rounded-xl transition-colors duration-300 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>
                Performance by Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.platformStats.map((platform, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 sm:p-6 rounded-xl border-2 ${
                      isDark
                        ? "bg-slate-700/50 border-slate-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-300"
                          : "bg-white border-gray-200 text-gray-700"
                      }`}>
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <p className={`font-bold capitalize ${isDark ? "text-white" : "text-gray-950"}`}>
                          {platform.platform}
                        </p>
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                          {platform.posts} posts • {platform.views.toLocaleString()} views
                        </p>
                      </div>
                    </div>
                    <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
                      {platform.engagement}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-950"}`}>
          Performance Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`border-2 rounded-xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader className="pb-4">
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Content Volume</CardTitle>
              <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
                Posts created over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureComingSoon
                compact
                isDark={isDark}
                icon={Calendar}
                title="Chart coming soon"
                description="Visual content volume trends will be available here."
              />
            </CardContent>
          </Card>

          <Card className={`border-2 rounded-xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader className="pb-4">
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Engagement Trends</CardTitle>
              <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
                Engagement rate over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureComingSoon
                compact
                isDark={isDark}
                icon={BarChart3}
                title="Real-time analytics coming soon"
                description="Engagement trend charts require platform analytics integration."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
