"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
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
} from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  platformStats: {
    platform: string;
    posts: number;
    views: number;
    engagement: number;
  }[];
  recentPerformance: {
    date: string;
    views: number;
    engagement: number;
  }[];
}

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [data, setData] = useState<AnalyticsData>({
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    engagementRate: 0,
    platformStats: [],
    recentPerformance: [],
  });
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
        setData(analyticsData);
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

  const metrics = [
    {
      title: "Total Views",
      value: data.totalViews.toLocaleString(),
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Likes",
      value: data.totalLikes.toLocaleString(),
      change: "+8.2%",
      trend: "up",
      icon: Heart,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Total Shares",
      value: data.totalShares.toLocaleString(),
      change: "+15.3%",
      trend: "up",
      icon: Share2,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Comments",
      value: data.totalComments.toLocaleString(),
      change: "+5.7%",
      trend: "up",
      icon: MessageSquare,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className={`space-y-6 sm:space-y-8 pb-8 pt-4 sm:pt-6 lg:pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 sm:pb-8 border-b-2 transition-colors duration-300 ${
        isDark ? "border-slate-700" : "border-gray-200"
      }`}>
        <div className="flex-1">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>Analytics Dashboard</h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Track your content performance across all platforms
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setTimeRange("7d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              timeRange === "7d"
                ? "bg-purple-600 text-white shadow-md"
                : isDark
                ? "bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              timeRange === "30d"
                ? "bg-purple-600 text-white shadow-md"
                : isDark
                ? "bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("90d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              timeRange === "90d"
                ? "bg-purple-600 text-white shadow-md"
                : isDark
                ? "bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className={`text-xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-950"
        }`}>Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => {
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
                  <div className={`text-2xl font-bold mb-3 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    {loading ? (
                      <div className={`h-10 w-28 rounded animate-pulse ${
                        isDark ? "bg-slate-700" : "bg-gray-200"
                      }`} />
                    ) : (
                      metric.value
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {metric.trend === "up" ? (
                      <TrendingUp className={`w-4 h-4 ${
                        isDark ? "text-green-400" : "text-green-600"
                      }`} />
                    ) : (
                      <TrendingDown className={`w-4 h-4 ${
                        isDark ? "text-red-400" : "text-red-600"
                      }`} />
                    )}
                    <span
                      className={
                        metric.trend === "up" 
                          ? isDark 
                            ? "text-green-400 font-semibold" 
                            : "text-green-600 font-semibold"
                          : isDark
                          ? "text-red-400 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {metric.change}
                    </span>
                    <span className={isDark ? "text-slate-400" : "text-gray-500"}>vs last period</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Engagement Rate Card */}
      <div>
        <h2 className={`text-xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-950"
        }`}>Engagement Overview</h2>
        <Card className={`border-2 rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-3 ${
              isDark ? "text-white" : "text-gray-950"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? "bg-slate-700" : "bg-gray-100"
              }`}>
                <BarChart3 className={`w-6 h-6 ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>Engagement Rate</h3>
                <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>Overall engagement across all platforms</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-end gap-6">
                <div className="flex-1">
                  <div className={`text-3xl font-bold mb-3 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    {loading ? (
                      <div className={`h-16 w-32 rounded animate-pulse ${
                        isDark ? "bg-slate-700" : "bg-gray-200"
                      }`} />
                    ) : (
                      `${data.engagementRate}%`
                    )}
                  </div>
                  <p className={`text-base font-medium ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>Average engagement rate</p>
                </div>
                <div className="flex-1">
                  <div className={`h-4 rounded-full overflow-hidden ${
                    isDark ? "bg-slate-700" : "bg-gray-200"
                  }`}>
                    <div
                      className="h-full bg-purple-600 transition-all duration-1000"
                      style={{ width: `${Math.min(data.engagementRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-3 pt-4 border-t transition-colors duration-300 ${
                isDark ? "border-slate-700" : "border-gray-200"
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-green-950/50" : "bg-green-50"
                }`}>
                  <TrendingUp className={`w-5 h-5 ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`} />
                </div>
                <div>
                  <p className={`text-base font-semibold ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}>+2.3% from last period</p>
                  <p className={`text-xs ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}>Positive trend</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <div>
        <h2 className={`text-xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-950"
        }`}>Platform Performance</h2>
        <Card className={`border-2 rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardHeader className="pb-4">
            <CardTitle className={`text-xl ${
              isDark ? "text-white" : "text-gray-950"
            }`}>Performance by Platform</CardTitle>
            <CardDescription className={isDark ? "text-slate-400" : "text-gray-600"}>
              See how your content performs across different platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.platformStats.length > 0 ? (
                data.platformStats.map((platform, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 ${
                      isDark
                        ? "bg-slate-700/50 border-slate-700 hover:border-slate-600"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border-2 ${
                        isDark
                          ? "bg-slate-800 border-slate-600 text-slate-300"
                          : "bg-white border-gray-200 text-gray-700"
                      }`}>
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <p className={`font-bold text-base sm:text-lg capitalize mb-1 ${
                          isDark ? "text-white" : "text-gray-950"
                        }`}>
                          {platform.platform}
                        </p>
                        <p className={`text-sm ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}>
                          {platform.posts} posts • {platform.views.toLocaleString()} views
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl sm:text-2xl font-bold mb-1 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        {platform.engagement}%
                      </p>
                      <p className={`text-xs font-medium ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>Engagement</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? "bg-slate-700" : "bg-gray-100"
                  }`}>
                    <BarChart3 className={`w-8 h-8 sm:w-10 sm:h-10 ${
                      isDark ? "text-slate-400" : "text-gray-400"
                    }`} />
                  </div>
                  <p className={`font-bold text-base sm:text-lg mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>No analytics data yet</p>
                  <p className={`text-sm ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>
                    Start posting content to see analytics
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-2 border-gray-200 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-xl">Content Volume</CardTitle>
              <CardDescription className="text-gray-600">Posts created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Visual analytics will be available here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-gray-200 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-xl">Engagement Trends</CardTitle>
              <CardDescription className="text-gray-600">Engagement rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Visual analytics will be available here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

