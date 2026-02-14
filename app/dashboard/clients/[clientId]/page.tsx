"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Building2,
  Plus,
  FileText,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface Client {
  id: number;
  name: string;
  logoUrl?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ClientStats {
  postsThisMonth: number;
  postsLimit: number;
  pendingApprovals: number;
  scheduledPosts: number;
  engagementRate: number;
}

export default function ClientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<ClientStats>({
    postsThisMonth: 0,
    postsLimit: 12,
    pendingApprovals: 0,
    scheduledPosts: 0,
    engagementRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      router.push("/dashboard");
      return;
    }

    const fetchClientData = async () => {
      try {
        setLoading(true);
        
        // Fetch client details
        const clientResponse = await fetch(`/api/clients/${clientId}?userId=${userId}`, {
          credentials: "include",
        });
        
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          setClient(clientData.client);
        } else {
          // Only log errors, don't show unnecessary toasts
          const errorData = await clientResponse.json().catch(() => ({}));
          console.error("Failed to load client:", clientResponse.status, errorData);
          // Only show error for actual authentication failures
          if (clientResponse.status === 401) {
            showToast.error(
              "Authentication required",
              "Please sign in to view this client."
            );
          }
          // For other errors, just log and continue
        }

        // TODO: Fetch client stats
        // For now, use placeholder data
        setStats({
          postsThisMonth: 8,
          postsLimit: 12,
          pendingApprovals: 3,
          scheduledPosts: 5,
          engagementRate: 4.2,
        });
      } catch (error) {
        console.error("Failed to fetch client data:", error);
        // Silent fail - don't show unnecessary toast
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId, router]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-28 h-28 rounded-full animate-pulse ${
                  isDark ? "bg-purple-500/20" : "bg-purple-100"
                }`}></div>
              </div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Logo size="lg" variant="icon" />
              </div>
            </div>
            <div className="flex space-x-2 justify-center mt-4">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Loading client data...
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={`text-center py-12 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Client not found</h2>
        <p className={`mb-6 ${isDark ? "text-slate-400" : "text-gray-600"}`}>The client you're looking for doesn't exist.</p>
        <Button 
          onClick={() => router.push("/dashboard")}
          className={isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const postsRemaining = stats.postsLimit - stats.postsThisMonth;
  const postsPercentage = (stats.postsThisMonth / stats.postsLimit) * 100;

  return (
    <div className={`space-y-6 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      {/* Client Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {client.logoUrl ? (
            <Image
              src={client.logoUrl}
              alt={client.name}
              width={48}
              height={48}
              className={`w-12 h-12 rounded-lg object-cover border ${isDark ? "border-slate-700" : "border-gray-200"}`}
              unoptimized={client.logoUrl.startsWith('http')}
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${isDark ? "bg-purple-900/50 border-slate-700" : "bg-purple-100 border-gray-200"}`}>
              <Building2 className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{client.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {client.paymentStatus === "overdue" && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-red-950/50 text-red-400" : "bg-red-100 text-red-700"}`}>
                  <AlertCircle className="w-3 h-3" />
                  Payment Due
                </span>
              )}
              {client.status === "paused" && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-yellow-950/50 text-yellow-400" : "bg-yellow-100 text-yellow-700"}`}>
                  <Clock className="w-3 h-3" />
                  Paused
                </span>
              )}
              {client.status === "active" && client.paymentStatus === "paid" && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-green-950/50 text-green-400" : "bg-green-100 text-green-700"}`}>
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/brand-voice`)}
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50"}`}
          >
            Brand Voice
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/credits`)}
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50"}`}
          >
            Credits
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50"}`}
          >
            Tasks
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/clients/${clientId}/generate`)}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              Posts This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {stats.postsThisMonth}
              </span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>/ {stats.postsLimit}</span>
            </div>
            <div className="mt-2">
              <div className={`w-full rounded-full h-2 ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(postsPercentage, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {postsRemaining} posts remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {stats.pendingApprovals}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Awaiting client approval
            </p>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {stats.scheduledPosts}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Upcoming posts
            </p>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {stats.engagementRate}%
              </span>
              <TrendingUp className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
            </div>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Average across platforms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className={`p-1 ${
          isDark ? "bg-slate-800" : "bg-gray-100"
        }`}>
          <TabsTrigger 
            value="calendar" 
            className={cn(
              isDark 
                ? "text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-950"
            )}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            className={cn(
              isDark 
                ? "text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-950"
            )}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approvals
            {stats.pendingApprovals > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-xs">
                {stats.pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className={cn(
              isDark 
                ? "text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-950"
            )}
          >
            <FileText className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className={cn(
              isDark 
                ? "text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-950"
            )}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader className={`border-b ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Content Calendar</CardTitle>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                    Visual overview of scheduled posts and approvals
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/calendar`)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-purple-400" : "text-purple-300"}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Calendar View</h3>
                <p className={`mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  See all scheduled posts in a visual calendar format
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/calendar`)}
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  Open Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingApprovals === 0 ? (
                <div className={`text-center py-12 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  <CheckCircle2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-500" : "text-gray-300"}`} />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className={`text-center py-12 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  <p>Approval list coming soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader className={`border-b ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Tasks</CardTitle>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                    Manage tasks and assignments for this client
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  View All Tasks
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-purple-400" : "text-purple-300"}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Task Management</h3>
                <p className={`mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  Create and assign tasks to team members
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  Go to Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader className={`border-b ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Analytics Dashboard</CardTitle>
                  <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                    Performance metrics and insights
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/analytics`)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart3 className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-purple-400" : "text-purple-300"}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Performance Insights</h3>
                <p className={`mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                  Track engagement, top posts, and platform performance
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/analytics`)}
                  className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                >
                  Open Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
