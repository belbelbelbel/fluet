"use client";

import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, BarChart3, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

export default function ClientDashboardPage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [stats, setStats] = useState({
    postsThisMonth: 0,
    pendingApprovals: 0,
    engagementRate: 0,
  });

  useEffect(() => {
    if (!clientId) return;
    // TODO: fetch real stats from API when available
    setStats({ postsThisMonth: 0, pendingApprovals: 0, engagementRate: 0 });
  }, [clientId]);

  const tabClass = cn(
    "data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=inactive]:border-transparent",
    isDark ? "data-[state=active]:text-white" : "data-[state=active]:text-gray-900"
  );

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
          <TabsTrigger value="posts" className={tabClass} variant="ghost">
            <Calendar className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="approvals" className={tabClass} variant="ghost">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="analytics" className={tabClass} variant="ghost">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="preferences" className={tabClass} variant="ghost">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="py-12 text-center">
              <FileText className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-slate-500" : "text-gray-400")} />
              <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                Your agency hasn&apos;t scheduled any posts yet.
              </h3>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                Scheduled posts will appear here when your agency adds them.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <Card className={cn("border", isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200")}>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className={cn("w-12 h-12 mx-auto mb-3", isDark ? "text-green-500" : "text-green-600")} />
              <h3 className={cn("text-lg font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>
                All clear! No approvals needed.
              </h3>
              <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-500")}>
                When there are posts waiting for your approval, they&apos;ll show up here.
              </p>
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
