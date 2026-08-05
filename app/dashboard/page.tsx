"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  TrendingUp,
  Bell,
  Search,
  MapPin,
  Plus,
  Building2,
  ChevronRight,
  Users,
  AlertCircle,
  FileCheck,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AlertBanner, type AlertBannerItem } from "@/components/AlertBanner";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

interface DashboardStats {
  totalContent: number;
  scheduledPosts: number;
  teamMembers: number;
  thisWeekContent: number;
  engagementRate: number | null;
  topPlatform: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    scheduledPosts: 0,
    teamMembers: 1,
    thisWeekContent: 0,
    engagementRate: null,
    topPlatform: null,
  });
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<{ id: number; name: string; status?: string }[]>([]);
  const [hasClients, setHasClients] = useState(false);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [alertBanners, setAlertBanners] = useState<AlertBannerItem[]>([]);
  const [needsAttention, setNeedsAttention] = useState<{
    pendingApprovals: { clientId: number; clientName: string; count: number }[];
    overduePayments: { clientId: number; clientName: string }[];
    creditsWarnings: { clientId: number; clientName: string; percentage: number }[];
  } | null>(null);

  // Load clients on mount; redirect to onboarding if none
  useEffect(() => {
    const loadClients = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/clients?userId=${userId}`, {
          credentials: "include",
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("[Dashboard] Non-JSON response from /api/clients:", text.substring(0, 200));
          setClientsLoaded(true);
          return;
        }
        if (response.ok) {
          const data = await response.json();
          const list = data.clients || [];
          setClients(list);
          setHasClients(list.length > 0);
        }
        setClientsLoaded(true);
      } catch (error) {
        console.error("Error loading clients:", error);
        setClientsLoaded(true);
      }
    };
    if (authLoaded && userId) {
      loadClients();
    }
  }, [userId, authLoaded]);

  // Redirect to onboarding when user has no clients
  useEffect(() => {
    if (authLoaded && userId && clientsLoaded && !hasClients) {
      router.replace("/dashboard/onboarding");
    }
  }, [authLoaded, userId, clientsLoaded, hasClients, router]);

  const fetchDashboardStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Use cache: 'force-cache' for better performance, with revalidation
      const response = await fetch(`/api/dashboard/stats?userId=${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 }, // Revalidate every 60 seconds
      });
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[Dashboard] Non-JSON response from /api/dashboard/stats:", text.substring(0, 200));
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalContent: data.totalContent ?? 0,
          scheduledPosts: data.scheduledPosts ?? 0,
          teamMembers: data.teamMembers ?? 1,
          thisWeekContent: data.thisWeekContent ?? 0,
          engagementRate: data.engagementRate ?? null,
          topPlatform: data.topPlatform ?? null,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      setLoading(true);
      return;
    }
    if (userId) {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [userId, authLoaded, userLoaded, fetchDashboardStats]);

  // Fetch needs-attention for triage panel (pending approvals, overdue payments, credits warnings)
  useEffect(() => {
    if (!userId) return;
    const loadNeedsAttention = async () => {
      try {
        const res = await fetch(`/api/dashboard/needs-attention?userId=${encodeURIComponent(userId)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setNeedsAttention(data);
        }
      } catch {
        setNeedsAttention(null);
      }
    };
    loadNeedsAttention();
  }, [userId]);

  // Fetch activity to show payment/credits banners (overdue = red block, credits 80% = yellow, 100% = red)
  useEffect(() => {
    if (!userId) return;
    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/activity", { credentials: "include" });
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType?.includes("application/json")) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const banners: AlertBannerItem[] = list
          .filter((a: { type: string }) =>
            ["payment_overdue", "credits_warning", "credits_exceeded"].includes(a.type)
          )
          .map((a: { id: string; type: string; message: string; clientName?: string; link?: string }) => ({
            id: a.id,
            variant: a.type as AlertBannerItem["variant"],
            message: a.message,
            clientName: a.clientName,
            link: a.link,
          }));
        setAlertBanners(banners);
      } catch {
        setAlertBanners([]);
      }
    };
    loadAlerts();
  }, [userId]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = user?.firstName || user?.fullName || "User";

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const weekStart = new Date(today.setDate(diff));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Show loading state
  if (loading || !authLoaded || !userLoaded) {
    return (
      <LoadingScreen
        variant="inline"
        message="Loading dashboard..."
        subtitle="Please wait while we load your dashboard data"
      />
    );
  }

  return (
    <div className={`min-h-screen max-w-8xl mx-auto transition-colors duration-300 flex flex-col ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Top Header */}
      <div className={`sticky top-0 z-10 border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 transition-colors duration-300 ${
        isDark
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-gray-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl sm:text-2xl font-bold truncate ${
              isDark ? "text-white" : "text-gray-950"
            }`}>
              Welcome, {userName}
          </h1>
            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}>{currentDate}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <Bell className={`w-5 h-5 cursor-pointer ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-950"
              }`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`} />
              <input
                type="text"
                placeholder="Search..."
                className={`pl-9 pr-8 py-2 w-full sm:w-48 lg:w-64 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                    : "border-gray-200"
                }`}
              />
              <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs hidden sm:inline ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}>
                /
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-7xl space-y-4 sm:space-y-6">
          {/* Payment / credits banners: overdue or exceeded = hard block */}
          <AlertBanner
            items={alertBanners}
            blockActions={alertBanners.some(
              (b) => b.variant === "payment_overdue" || b.variant === "credits_exceeded"
            )}
          />
          {/* Needs Attention — triage panel when agency has items to act on */}
          {needsAttention &&
            (needsAttention.pendingApprovals.length > 0 ||
              needsAttention.overduePayments.length > 0 ||
              needsAttention.creditsWarnings.length > 0) && (
              <Card className={`border rounded-xl transition-colors shadow-sm ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              }`}>
                <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className={`text-base sm:text-lg font-semibold flex items-center gap-2 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                    Needs attention
                  </CardTitle>
                  <p className={`text-sm mt-1 ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>
                    Clients that need your action
                  </p>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {needsAttention.pendingApprovals.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          <FileCheck className="w-4 h-4 text-purple-500" />
                          Awaiting approval
                        </div>
                        <div className="space-y-1.5">
                          {needsAttention.pendingApprovals.slice(0, 3).map((item) => (
                            <button
                              key={item.clientId}
                              onClick={() => router.push(`/dashboard/schedule`)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                isDark
                                  ? "bg-slate-900/50 hover:bg-slate-700 border border-slate-700"
                                  : "bg-purple-50/50 hover:bg-purple-50 border border-purple-100"
                              }`}
                            >
                              <span className={`font-medium truncate text-sm ${
                                isDark ? "text-slate-200" : "text-gray-900"
                              }`}>
                                {item.clientName}
                              </span>
                              <span className={`text-xs shrink-0 ${
                                isDark ? "text-slate-500" : "text-gray-500"
                              }`}>
                                {item.count} post{item.count !== 1 ? "s" : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {needsAttention.overduePayments.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          <CreditCard className="w-4 h-4 text-red-500" />
                          Payment overdue
                        </div>
                        <div className="space-y-1.5">
                          {needsAttention.overduePayments.slice(0, 3).map((item) => (
                            <button
                              key={item.clientId}
                              onClick={() => router.push(`/dashboard/clients/${item.clientId}`)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                isDark
                                  ? "bg-slate-900/50 hover:bg-slate-700 border border-slate-700"
                                  : "bg-red-50/50 hover:bg-red-50 border border-red-100"
                              }`}
                            >
                              <span className={`font-medium truncate text-sm ${
                                isDark ? "text-slate-200" : "text-gray-900"
                              }`}>
                                {item.clientName}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {needsAttention.creditsWarnings.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 mb-2 text-sm font-medium ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          Credits warning
                        </div>
                        <div className="space-y-1.5">
                          {needsAttention.creditsWarnings.slice(0, 3).map((item) => (
                            <button
                              key={item.clientId}
                              onClick={() => router.push(`/dashboard/clients/${item.clientId}/credits`)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                                isDark
                                  ? "bg-slate-900/50 hover:bg-slate-700 border border-slate-700"
                                  : "bg-amber-50/50 hover:bg-amber-50 border border-amber-100"
                              }`}
                            >
                              <span className={`font-medium truncate text-sm ${
                                isDark ? "text-slate-200" : "text-gray-900"
                              }`}>
                                {item.clientName}
                              </span>
                              <span className={`text-xs shrink-0 ${
                                isDark ? "text-amber-400" : "text-amber-700"
                              }`}>
                                {item.percentage}% used
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/clients")}
                    className={`mt-4 ${
                      isDark ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    View all clients
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`border rounded-xl transition-colors shadow-sm ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Total posts
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.totalContent
                )}
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-green-600">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">{stats.thisWeekContent} created this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`border rounded-xl transition-colors shadow-sm ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Scheduled posts
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.scheduledPosts
                )}
              </div>
              <div className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Upcoming in your queue
              </div>
            </CardContent>
          </Card>

          <Card className={`border rounded-xl sm:col-span-2 lg:col-span-1 transition-colors ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Top platform
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mb-1.5 sm:mb-2 capitalize ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.topPlatform ?? "—"
                )}
              </div>
              <div className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Based on content you&apos;ve created
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your clients — always visible; shows list or "No clients" */}
        {!loading && userId && (
          <Card className={`border rounded-xl transition-colors shadow-sm ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6 flex flex-row items-center justify-between space-y-0">
              <CardTitle className={`text-base sm:text-lg font-semibold flex items-center gap-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                <Users className="w-5 h-5 text-purple-500" />
                Your clients
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasClients && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/clients")}
                    className={`text-xs sm:text-sm ${
                      isDark ? "text-slate-300 hover:text-white hover:bg-slate-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    Manage all
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => router.push("/dashboard/clients/new")}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add client
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              {hasClients && clients.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    {clients.slice(0, 6).map((client: { id: number; name: string; status?: string }) => (
                      <button
                        key={client.id}
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-left min-w-0 transition-colors ${
                          isDark
                            ? "bg-slate-900/50 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-700"
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className={`font-medium truncate text-sm ${
                          isDark ? "text-slate-200" : "text-gray-900"
                        }`}>
                          {client.name}
                        </span>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                          isDark ? "text-slate-500" : "text-gray-400"
                        }`} />
                      </button>
                    ))}
                  </div>
                  {clients.length > 6 && (
                    <p className={`text-xs mt-3 ${
                      isDark ? "text-slate-500" : "text-gray-500"
                    }`}>
                      +{clients.length - 6} more —{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/clients")}
                        className="font-medium text-purple-600 hover:text-purple-700 underline"
                      >
                        view all clients
                      </button>
                    </p>
                  )}
                </>
              ) : (
                <div className={`py-6 text-center rounded-lg border border-dashed ${
                  isDark ? "border-slate-600 bg-slate-900/30" : "border-gray-200 bg-gray-50"
                }`}>
                  <Building2 className={`w-10 h-10 mx-auto mb-2 ${
                    isDark ? "text-slate-500" : "text-gray-400"
                  }`} />
                  <p className={`text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>
                    No clients yet
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDark ? "text-slate-500" : "text-gray-500"
                  }`}>
                    Create your first client to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Feed */}
        <ActivityFeed maxItems={3} autoRefresh={true} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - 2 spans */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* My Social Overview */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                  <CardTitle className={`text-base sm:text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>
                    My social overview
                </CardTitle>
                  <div className="flex items-center gap-2">
                    <select className={`flex-1 sm:flex-none text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? "bg-slate-700 border-slate-600 text-slate-200" 
                        : "bg-white border-gray-200 text-gray-700"
                    }`}>
                      <option>Jul 2024 - Dec 2024</option>
                      <option>Jan 2024 - Jun 2024</option>
                    </select>
                    <select className={`flex-1 sm:flex-none text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? "bg-slate-700 border-slate-600 text-slate-200" 
                        : "bg-white border-gray-200 text-gray-700"
                    }`}>
                      <option>Engagement</option>
                      <option>Reach</option>
                      <option>Impressions</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <FeatureComingSoon
                  isDark={isDark}
                  icon={TrendingUp}
                  title="Real-time analytics coming soon"
                  description="Engagement charts and geography breakdowns will appear here once social platform analytics are connected."
                />
              </CardContent>
            </Card>

            {/* Engagement Rate Metrics */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Engagement rate metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <FeatureComingSoon
                  compact
                  isDark={isDark}
                  icon={BarChart3}
                  title="Engagement metrics coming soon"
                  description="Platform engagement rates require analytics integration — they are not available yet."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Top Geographies */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Top geographies
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <FeatureComingSoon
                  compact
                  isDark={isDark}
                  icon={MapPin}
                  title="Geography data coming soon"
                  description="Audience location insights will be available with platform analytics."
                />
              </CardContent>
            </Card>

            {/* My Post Planner */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  My post planner
            </CardTitle>
          </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  {weekDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-center min-w-[60px] sm:min-w-[70px] ${
                        date.isToday
                          ? "bg-purple-600 text-white"
                          : isDark
                          ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-xs font-medium">{date.day}</div>
                      <div className="text-sm font-semibold mt-1">
                        {date.date}
                  </div>
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments and Mentions */}
            <Card className={`border rounded-xl transition-colors shadow-sm ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-950"
                }`}>
                  Comments and mentions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <FeatureComingSoon
                  compact
                  isDark={isDark}
                  icon={Bell}
                  title="Social inbox coming soon"
                  description="Comments and mentions from connected platforms will appear here."
                />
              </CardContent>
            </Card>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
