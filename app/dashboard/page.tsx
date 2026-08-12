"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientAvatar } from "@/components/ClientAvatar";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  TrendingUp,
  Bell,
  Search,
  Plus,
  Building2,
  ChevronRight,
  Eye,
  Heart,
  Share2,
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { type AlertBannerItem } from "@/components/AlertBanner";
import { AttentionToast, type AttentionItem } from "@/components/AttentionToast";

interface DashboardStats {
  totalContent: number;
  scheduledPosts: number;
  teamMembers: number;
  thisWeekContent: number;
  engagementRate: number | null;
  topPlatform: string | null;
}

interface OverviewData {
  contentVolume: { date: string; generated: number; scheduled: number }[];
  activityPlatformStats: { platform: string; posts: number }[];
  engagementMetricsAvailable: boolean;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number | null;
  platformStats: { platform: string; posts: number; views: number; engagement: number }[];
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
  const [overview, setOverview] = useState<OverviewData>({
    contentVolume: [],
    activityPlatformStats: [],
    engagementMetricsAvailable: false,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    engagementRate: null,
    platformStats: [],
  });
  const [overviewRange, setOverviewRange] = useState<"7d" | "30d" | "90d">("30d");

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

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const loadOverview = async () => {
      try {
        const res = await fetch(`/api/analytics?range=${overviewRange}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setOverview({
          contentVolume: data.contentVolume || [],
          activityPlatformStats: data.activityPlatformStats || [],
          engagementMetricsAvailable: !!data.engagementMetricsAvailable,
          totalViews: data.totalViews ?? 0,
          totalLikes: data.totalLikes ?? 0,
          totalShares: data.totalShares ?? 0,
          totalComments: data.totalComments ?? 0,
          engagementRate: data.engagementRate ?? null,
          platformStats: data.platformStats || [],
        });
        if (data.engagementRate != null) {
          setStats((prev) => ({ ...prev, engagementRate: data.engagementRate }));
        }
      } catch {
        /* keep previous overview */
      }
    };
    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [userId, overviewRange]);

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


  // Everything that used to sit above the KPI row — payment/credit banners and
  // the "Needs attention" panel — folded into one docked toast so the page
  // itself opens on the numbers.
  const attentionItems: AttentionItem[] = useMemo(() => {
    const out: AttentionItem[] = [];

    for (const b of alertBanners) {
      out.push({
        id: `banner-${b.id}`,
        severity:
          b.variant === "payment_overdue" || b.variant === "credits_exceeded"
            ? "critical"
            : "warning",
        group:
          b.variant === "payment_overdue" ? "Payment overdue" : "Credits",
        label: b.clientName || b.message,
        href: b.link,
      });
    }

    for (const a of needsAttention?.pendingApprovals ?? []) {
      out.push({
        id: `approval-${a.clientId}`,
        severity: "info",
        group: "Awaiting approval",
        label: a.clientName,
        meta: `${a.count} post${a.count !== 1 ? "s" : ""}`,
        href: "/dashboard/schedule",
      });
    }

    for (const p of needsAttention?.overduePayments ?? []) {
      if (out.some((i) => i.group === "Payment overdue" && i.label === p.clientName)) continue;
      out.push({
        id: `overdue-${p.clientId}`,
        severity: "critical",
        group: "Payment overdue",
        label: p.clientName,
        href: `/dashboard/clients/${p.clientId}`,
      });
    }

    for (const c of needsAttention?.creditsWarnings ?? []) {
      out.push({
        id: `credits-${c.clientId}`,
        severity: "warning",
        group: "Credits running low",
        label: c.clientName,
        meta: `${c.percentage}% used`,
        href: `/dashboard/clients/${c.clientId}/credits`,
      });
    }

    return out;
  }, [alertBanners, needsAttention]);

  const actionsBlocked = alertBanners.some(
    (b) => b.variant === "payment_overdue" || b.variant === "credits_exceeded"
  );

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
    <div className={`min-h-screen max-w-8xl mx-auto transition-colors duration-300 flex flex-col bg-background`}>
      {/* Top Header */}
      <div className={`sticky top-0 z-10 border-b border-border dark:border-slate-600 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 transition-colors duration-300 bg-background`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl sm:text-2xl font-medium truncate text-foreground`}>
              Welcome, {userName}
          </h1>
            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 text-muted-foreground`}>{currentDate}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <Bell className={`w-5 h-5 cursor-pointer ${
                "text-muted-foreground hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
              }`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                "text-muted-foreground/70 dark:text-gray-500"
              }`} />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-9 w-full sm:w-48 lg:w-64"
              />
              <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs hidden sm:inline ${
                "text-muted-foreground/70 dark:text-gray-500"
              }`}>
                /
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts live in the chrome, not the page flow — see AttentionToast */}
      <AttentionToast items={attentionItems} blocked={actionsBlocked} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-7xl space-y-4 sm:space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`rounded-xl transition-colors bg-card`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted-foreground`}>
                Total posts
              </div>
              <div className={`text-2xl sm:text-3xl font-medium mb-1.5 sm:mb-2 text-foreground`}>
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

          <Card className={`rounded-xl transition-colors bg-card`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted-foreground`}>
                Scheduled posts
              </div>
              <div className={`text-2xl sm:text-3xl font-medium mb-1.5 sm:mb-2 text-foreground`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.scheduledPosts
                )}
              </div>
              <div className={`text-xs sm:text-sm text-muted-foreground`}>
                Upcoming in your queue
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-xl sm:col-span-2 lg:col-span-1 transition-colors ${
            "bg-white dark:bg-gray-900"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted-foreground`}>
                Top platform
              </div>
              <div className={`text-2xl sm:text-3xl font-medium mb-1.5 sm:mb-2 capitalize text-foreground`}>
                {loading ? (
                  <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats.topPlatform ?? "—"
                )}
              </div>
              <div className={`text-xs sm:text-sm text-muted-foreground`}>
                Based on content you&apos;ve created
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your clients — always visible; shows list or "No clients" */}
        {!loading && userId && (
          <Card className={`rounded-xl transition-colors bg-card`}>
            <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base sm:text-lg font-medium">
                Your clients
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasClients && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/clients")}
                    className={`text-xs sm:text-sm ${
                      "text-muted-foreground hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
                    }`}
                  >
                    Manage all
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => router.push("/dashboard/clients/new")}
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
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-border text-left min-w-0 transition-colors hover:bg-accent/50 ${
                          "bg-card dark:bg-card"
                        }`}
                      >
                        <ClientAvatar name={client.name} size="sm" />
                        <span className={`font-medium truncate text-sm text-foreground`}>
                          {client.name}
                        </span>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 text-muted-foreground/70`} />
                      </button>
                    ))}
                  </div>
                  {clients.length > 6 && (
                    <p className={`text-xs mt-3 text-muted-foreground`}>
                      +{clients.length - 6} more —{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/clients")}
                        className="font-medium text-foreground hover:underline"
                      >
                        view all clients
                      </button>
                    </p>
                  )}
                </>
              ) : (
                <div className={`py-6 text-center rounded-lg border border-dashed border-border dark:border-slate-600 ${
                  "bg-muted dark:bg-slate-900/30"
                }`}>
                  <Building2 className={`w-10 h-10 mx-auto mb-2 text-muted-foreground/70`} />
                  <p className={`text-sm font-medium text-muted-foreground`}>
                    No clients yet
                  </p>
                  <p className={`text-xs mt-1 text-muted-foreground`}>
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
            <Card className={`rounded-xl transition-colors bg-card`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                  <CardTitle className={`text-base sm:text-lg font-medium text-foreground`}>
                    Activity overview
                </CardTitle>
                  <div className="flex items-center gap-2">
                    <select
                      value={overviewRange}
                      onChange={(e) =>
                        setOverviewRange(e.target.value as "7d" | "30d" | "90d")
                      }
                      className={`flex-1 sm:flex-none text-xs sm:text-sm border rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring ${
                      "bg-white border-border text-foreground/80 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    }`}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                    <Link
                      href="/dashboard/analytics"
                      className={`text-xs font-medium whitespace-nowrap ${
                        "text-muted-foreground hover:text-gray-950 dark:text-slate-300 dark:hover:text-white"
                      }`}
                    >
                      Full analytics
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <MiniVolumeChart series={overview.contentVolume} />
              </CardContent>
            </Card>

            {/* Engagement Rate Metrics */}
            <Card className={`rounded-xl transition-colors bg-card`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-medium text-foreground`}>
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {overview.engagementMetricsAvailable ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Views", value: overview.totalViews, icon: Eye },
                        { label: "Likes", value: overview.totalLikes, icon: Heart },
                        { label: "Shares", value: overview.totalShares, icon: Share2 },
                        {
                          label: "Rate",
                          value:
                            overview.engagementRate != null
                              ? `${overview.engagementRate}%`
                              : "—",
                          icon: TrendingUp,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-lg p-3 ${
                            "bg-muted dark:bg-slate-700/60"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <item.icon
                              className={`h-3.5 w-3.5 text-muted-foreground`}
                            />
                            <span
                              className={`text-xs text-muted-foreground`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p
                            className={`text-lg font-semibold tabular-nums text-foreground`}
                          >
                            {typeof item.value === "number"
                              ? item.value.toLocaleString()
                              : item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {overview.platformStats.length > 0 && (
                      <div className="space-y-2">
                        {overview.platformStats.map((p) => (
                          <div
                            key={p.platform}
                            className="flex items-center justify-between text-sm"
                          >
                            <span
                              className={`capitalize text-foreground/80`}
                            >
                              {p.platform}
                            </span>
                            <span
                              className={"text-muted-foreground"}
                            >
                              {p.engagement}% · {p.views.toLocaleString()} views
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-4 py-6 text-center ${
                      "bg-muted dark:bg-slate-700/40"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium text-foreground`}
                    >
                      No engagement data yet
                    </p>
                    <p
                      className={`text-xs mt-1.5 max-w-sm mx-auto text-muted-foreground`}
                    >
                      Connect Twitter in Settings and auto-post — metrics sync on each cron run.
                    </p>
                    <Link
                      href="/dashboard/settings"
                      className="inline-block mt-3 text-xs font-medium text-primary hover:underline"
                    >
                      Open settings
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Platform mix */}
            <Card className={`rounded-xl transition-colors bg-card`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-medium text-foreground`}>
                  Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {overview.activityPlatformStats.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const max = Math.max(
                        ...overview.activityPlatformStats.map((p) => p.posts),
                        1
                      );
                      return overview.activityPlatformStats.map((p) => (
                        <div key={p.platform}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span
                              className={`capitalize text-foreground`}
                            >
                              {p.platform}
                            </span>
                            <span
                              className={"text-muted-foreground"}
                            >
                              {p.posts} posts
                            </span>
                          </div>
                          <div
                            className={`h-1.5 rounded-full overflow-hidden bg-accent`}
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.round((p.posts / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p
                    className={`text-sm py-4 text-center text-muted-foreground`}
                  >
                    Schedule posts to see platform mix.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* My Post Planner */}
            <Card className={`rounded-xl transition-colors bg-card`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className={`text-base sm:text-lg font-medium text-foreground`}>
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
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground/80 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <div className="text-xs font-medium">{date.day}</div>
                      <div className="text-sm font-medium mt-1">
                        {date.date}
                  </div>
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workspace inbox preview */}
            <Card className={`rounded-xl transition-colors bg-card`}>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className={`text-base sm:text-lg font-medium text-foreground`}>
                    Inbox
                  </CardTitle>
                  <Link
                    href="/dashboard/inbox"
                    className={`text-xs font-medium ${
                      "text-muted-foreground hover:text-gray-950 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    Open all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <ActivityFeed maxItems={5} autoRefresh={false} embedded />
                <p className={`text-xs mt-3 text-muted-foreground/70`}>
                  Approvals & tasks now · social comments when platforms connect
                </p>
              </CardContent>
            </Card>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function MiniVolumeChart({
  series,
}: {
  series: { date: string; generated: number; scheduled: number }[];
}) {
  if (!series.length) {
    return (
      <p className={`text-sm py-10 text-center text-muted-foreground`}>
        No activity in this range yet.
      </p>
    );
  }

  const step = series.length > 30 ? Math.ceil(series.length / 28) : 1;
  const bars = series.filter((_, i) => i % step === 0 || i === series.length - 1);
  const max = Math.max(...bars.map((b) => b.generated + b.scheduled), 1);
  const totalGen = series.reduce((s, d) => s + d.generated, 0);
  const totalSched = series.reduce((s, d) => s + d.scheduled, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-0.5 h-36">
        {bars.map((day) => {
          const total = day.generated + day.scheduled;
          const h = Math.max(4, Math.round((total / max) * 100));
          const genShare = total ? (day.generated / total) * 100 : 0;
          return (
            <div
              key={day.date}
              className="flex-1 min-w-0 flex flex-col justify-end"
              title={`${day.date}: ${day.generated} generated, ${day.scheduled} scheduled`}
            >
              <div
                className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end"
                style={{ height: `${h}%` }}
              >
                <div
                  className={"bg-sky-500 dark:bg-sky-400/90"}
                  style={{ height: `${genShare}%`, minHeight: day.generated ? 2 : 0 }}
                />
                <div
                  className={"bg-emerald-500/80 dark:bg-emerald-400/80"}
                  style={{
                    height: `${100 - genShare}%`,
                    minHeight: day.scheduled ? 2 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={`flex flex-wrap gap-4 text-xs text-muted-foreground`}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-sm ${"bg-sky-500 dark:bg-sky-400"}`} />
          {totalGen} generated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-sm ${"bg-emerald-500 dark:bg-emerald-400"}`}
          />
          {totalSched} scheduled
        </span>
      </div>
    </div>
  );
}
