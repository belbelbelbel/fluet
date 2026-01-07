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
      const response = await fetch(`/api/analytics?userId=${userId}&range=${timeRange}`);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Track your content performance across all platforms
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTimeRange("7d")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              timeRange === "7d"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              timeRange === "30d"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("90d")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              timeRange === "90d"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className={`${metric.bgColor} border-gray-700 hover:border-gray-600 transition-all`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {metric.title}
                </CardTitle>
                <div className={`${metric.color} ${metric.bgColor} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {loading ? (
                    <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    metric.value
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span
                    className={
                      metric.trend === "up" ? "text-green-400" : "text-red-400"
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

      {/* Engagement Rate Card */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Engagement Rate
          </CardTitle>
          <CardDescription>Overall engagement across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div>
                <div className="text-5xl font-bold text-white mb-2">
                  {loading ? (
                    <div className="h-12 w-20 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    `${data.engagementRate}%`
                  )}
                </div>
                <p className="text-sm text-gray-400">Average engagement rate</p>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${data.engagementRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">+2.3% from last period</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Platform Performance</CardTitle>
          <CardDescription>
            See how your content performs across different platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.platformStats.length > 0 ? (
              data.platformStats.map((platform, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                      {getPlatformIcon(platform.platform)}
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">
                        {platform.platform}
                      </p>
                      <p className="text-sm text-gray-400">
                        {platform.posts} posts • {platform.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-400">
                      {platform.engagement}%
                    </p>
                    <p className="text-xs text-gray-400">Engagement</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No analytics data yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start posting content to see analytics
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Content Volume</CardTitle>
            <CardDescription>Posts created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Engagement Trends</CardTitle>
            <CardDescription>Engagement rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

