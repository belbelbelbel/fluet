"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Loader2,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPlatform: string;
  postsThisMonth: number;
  postsLastMonth: number;
  engagementGrowth: number;
  topPerformingPost: {
    id: number;
    platform: string;
    content: string;
    engagementRate: number;
  } | null;
  platformBreakdown: Array<{
    platform: string;
    posts: number;
    engagement: number;
    engagementRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    posts: number;
    engagement: number;
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
          {
            credentials: "include",
          }
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
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
        <p className="text-gray-600">Analytics will appear here once posts are published.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }
            >
              {range === "7d"
                ? "7 Days"
                : range === "30d"
                ? "30 Days"
                : range === "90d"
                ? "90 Days"
                : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {analytics.totalPosts}
              </span>
              <span className="text-sm text-gray-500">
                {analytics.postsThisMonth} this month
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {analytics.postsThisMonth >= analytics.postsLastMonth ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-xs ${
                  analytics.postsThisMonth >= analytics.postsLastMonth
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(analytics.postsThisMonth - analytics.postsLastMonth)} vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {analytics.totalEngagement.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Likes, comments, shares
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg. Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {analytics.averageEngagementRate.toFixed(1)}%
              </span>
              {analytics.engagementGrowth > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.engagementGrowth > 0 ? "+" : ""}
              {analytics.engagementGrowth.toFixed(1)}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Top Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 capitalize">
                {analytics.topPlatform}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Highest engagement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {analytics.platformBreakdown.map((platform) => (
              <div key={platform.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {platform.platform}
                  </span>
                  <span className="text-sm text-gray-600">
                    {platform.engagementRate.toFixed(1)}% engagement
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (platform.engagementRate / analytics.averageEngagementRate) * 50,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{platform.posts} posts</span>
                  <span>{platform.engagement.toLocaleString()} engagements</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Post */}
      {analytics.topPerformingPost && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Top Performing Post
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {analytics.topPerformingPost.platform}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {analytics.topPerformingPost.engagementRate.toFixed(1)}% engagement
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {analytics.topPerformingPost.content}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Monthly Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {analytics.monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">{month.month}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {month.posts} posts
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {month.engagement.toLocaleString()} engagements
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (month.engagement /
                            Math.max(
                              ...analytics.monthlyTrend.map((m) => m.engagement)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
