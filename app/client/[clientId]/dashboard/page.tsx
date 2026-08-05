"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, BarChart3, Settings, FileText, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

interface DashboardData {
  clientName: string;
  stats: { postsThisMonth: number; pendingApprovals: number; engagementRate: number };
  posts: Array<{
    id: number;
    platform: string;
    content: string;
    scheduledFor: string | null;
    posted: boolean | null;
    postedAt: string | null;
    approvalStatus: string | null;
  }>;
  pendingApprovals: Array<{
    id: number;
    approvalToken: string;
    status: string;
    content: string;
    platform: string;
    scheduledFor: string | null;
  }>;
}

export default function ClientDashboardPage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/client/${clientId}/dashboard`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId]);

  const stats = data?.stats ?? { postsThisMonth: 0, pendingApprovals: 0, engagementRate: 0 };
  const posts = data?.posts ?? [];
  const pendingApprovals = data?.pendingApprovals ?? [];

  const tabClass = cn(
    "data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=inactive]:border-transparent",
    isDark ? "data-[state=active]:text-white" : "data-[state=active]:text-gray-900"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className={cn("w-8 h-8 animate-spin mx-auto mb-4", isDark ? "text-purple-400" : "text-purple-600")} />
          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-600")}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-gray-600")}>
              Posts this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              {stats.postsThisMonth}
            </span>
          </CardContent>
        </Card>
        <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-gray-600")}>
              Pending approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              {stats.pendingApprovals}
            </span>
          </CardContent>
        </Card>
        <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-gray-600")}>
              Engagement rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
              {stats.engagementRate}%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Posts | Approvals | Analytics | Preferences */}
      <Tabs defaultValue={stats.pendingApprovals > 0 ? "approvals" : "posts"} className="space-y-4">
        <TabsList className={cn("p-0 h-auto gap-0 border-b rounded-none bg-transparent", isDark ? "border-slate-700" : "border-gray-200")}>
          <TabsTrigger value="posts" className={tabClass}>
            <Calendar className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="approvals" className={tabClass}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="analytics" className={tabClass}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="preferences" className={tabClass}>
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="p-0">
              {posts.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-slate-500" : "text-gray-400")} />
                  <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                    No posts scheduled yet
                  </h3>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                    Your agency will add scheduled posts here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                  {posts.map((post) => (
                    <li key={post.id} className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded", isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-700")}>
                          {post.platform}
                        </span>
                        {post.posted ? (
                          <span className="text-xs text-green-600 dark:text-green-400">Published</span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : "Scheduled"}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-sm line-clamp-2", isDark ? "text-slate-300" : "text-gray-700")}>
                        {post.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="p-0">
              {pendingApprovals.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-green-500" : "text-green-600")} />
                  <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                    All clear! No approvals needed.
                  </h3>
                  <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                    When there are posts waiting for your approval, they&apos;ll show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                  {pendingApprovals.map((a) => (
                    <li key={a.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded mr-2", isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-800")}>
                          {a.platform}
                        </span>
                        <p className={cn("text-sm mt-1 line-clamp-2", isDark ? "text-slate-300" : "text-gray-700")}>
                          {a.content}
                        </p>
                        {a.scheduledFor && (
                          <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-gray-500")}>
                            Scheduled: {new Date(a.scheduledFor).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Link href={`/client-portal/${a.approvalToken}`} className="flex-shrink-0">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Review & approve
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="py-12 text-center">
              <BarChart3 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-slate-500" : "text-gray-400")} />
              <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                Analytics will appear after posts are published.
              </h3>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                Engagement and performance data will show here once you have published content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="py-12 text-center">
              <Settings className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-slate-500" : "text-gray-400")} />
              <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                Brand tone & notification settings
              </h3>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                Configure how you want to be notified and your brand preferences. (Coming soon.)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
