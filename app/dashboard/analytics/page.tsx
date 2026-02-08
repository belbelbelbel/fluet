"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
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
    <div className="space-y-8 pb-8 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-3">Analytics Dashboard</h1>
          <p className="text-lg text-gray-600">
            Track your content performance across all platforms
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setTimeRange("7d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              timeRange === "7d"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              timeRange === "30d"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("90d")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              timeRange === "90d"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-bold text-gray-950 mb-6">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={index}
                className="bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all rounded-xl"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    {metric.title}
                  </CardTitle>
                  <div className="text-gray-700 bg-gray-100 p-3 rounded-xl">
                    <Icon className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-950 mb-3">
                    {loading ? (
                      <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      metric.value
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {metric.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        metric.trend === "up" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                      }
                    >
                      {metric.change}
                    </span>
                    <span className="text-gray-500">vs last period</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Engagement Rate Card */}
      <div>
        <h2 className="text-xl font-bold text-gray-950 mb-6">Engagement Overview</h2>
        <Card className="bg-white border-2 border-gray-200 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-950">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Engagement Rate</h3>
                <CardDescription className="text-gray-600 mt-1">Overall engagement across all platforms</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-end gap-6">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-gray-950 mb-3">
                    {loading ? (
                      <div className="h-16 w-32 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      `${data.engagementRate}%`
                    )}
                  </div>
                  <p className="text-base text-gray-600 font-medium">Average engagement rate</p>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-1000"
                      style={{ width: `${Math.min(data.engagementRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-base text-green-600 font-semibold">+2.3% from last period</p>
                  <p className="text-xs text-gray-500">Positive trend</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <div>
        <h2 className="text-xl font-bold text-gray-950 mb-6">Platform Performance</h2>
        <Card className="bg-white border-2 border-gray-200 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-950 text-xl">Performance by Platform</CardTitle>
            <CardDescription className="text-gray-600">
              See how your content performs across different platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.platformStats.length > 0 ? (
                data.platformStats.map((platform, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center border-2 border-gray-200 text-gray-700">
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-950 capitalize mb-1">
                          {platform.platform}
                        </p>
                        <p className="text-sm text-gray-600">
                          {platform.posts} posts • {platform.views.toLocaleString()} views
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-950 mb-1">
                        {platform.engagement}%
                      </p>
                      <p className="text-xs text-gray-600 font-medium">Engagement</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-2">No analytics data yet</p>
                  <p className="text-sm text-gray-600">
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

