"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "@/lib/toast";

interface DashboardStats {
  totalContent: number;
  scheduledPosts: number;
  teamMembers: number;
  thisWeekContent: number;
  engagementRate: number;
  topPlatform: string;
}

export default function DashboardPage() {
  const { userId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    scheduledPosts: 0,
    teamMembers: 1,
    thisWeekContent: 0,
    engagementRate: 0,
    topPlatform: "Twitter",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDashboardStats();
    }
  }, [userId]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Content",
      value: stats.totalContent,
      description: "All time generated",
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Scheduled Posts",
      value: stats.scheduledPosts,
      description: "Upcoming posts",
      icon: Calendar,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      title: "This Week",
      value: stats.thisWeekContent,
      description: "Generated this week",
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      title: "Engagement Rate",
      value: `${stats.engagementRate}%`,
      description: "Average across platforms",
      icon: BarChart3,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
  ];

  const quickActions = [
    {
      title: "Generate Content",
      description: "Create AI-powered posts",
      href: "/dashboard/generate",
      icon: Wand2,
      color: "from-blue-600 to-blue-700",
    },
    {
      title: "View Analytics",
      description: "Track performance",
      href: "/dashboard/analytics",
      icon: BarChart3,
      color: "from-purple-600 to-purple-700",
    },
    {
      title: "Manage Team",
      description: "Invite collaborators",
      href: "/dashboard/team",
      icon: Users,
      color: "from-green-600 to-green-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your content today
          </p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border-2 hover:scale-105 transition-transform duration-200`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} ${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="group hover:border-gray-700 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span className="text-sm font-medium">Get started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Top Platform */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Platform */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Top Platform
            </CardTitle>
            <CardDescription>Your most active platform this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-2xl">🐦</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{stats.topPlatform}</p>
                    <p className="text-sm text-gray-400">Most content generated</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <Link href="/dashboard/analytics">
                  <Button variant="outline" className="w-full">
                    View Full Analytics
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-blue-400" />
              Performance Insights
            </CardTitle>
            <CardDescription>Your content performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Engagement Rate</p>
                    <p className="text-xs text-gray-400">Average across all posts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{stats.engagementRate}%</p>
                  <p className="text-xs text-gray-400">↑ 2.3% this week</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Response Time</p>
                    <p className="text-xs text-gray-400">Average generation time</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">2.4s</p>
                  <p className="text-xs text-gray-400">Lightning fast ⚡</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

