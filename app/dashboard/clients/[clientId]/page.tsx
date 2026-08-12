"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  Lightbulb,
  Pencil,
  X,
  Loader2,
  Copy,
  ExternalLink,
  History as HistoryIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostRow, type PostStatus } from "@/components/PostRow";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Client {
  id: number;
  name: string;
  email?: string | null;
  logoUrl?: string | null;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ClientStats {
  postsThisMonth: number;
  postsLimit: number;
  pendingApprovals: number;
  scheduledPosts: number;
  engagementRate: number | null;
  engagementMetricsAvailable: boolean;
}

interface PendingApproval {
  id: number;
  approvalToken: string;
  status: string;
  content: string;
  platform: string;
  scheduledFor: string | null;
  approvalLink: string;
}

interface UpcomingPost {
  id: number;
  platform: string;
  content: string;
  scheduledFor: string;
  posted: boolean | null;
  approvalStatus: string | null;
}

/** A post that actually went out — the client's record of work delivered. */
interface PublishedPost {
  id: number;
  platform: string;
  content: string;
  scheduledFor: string | null;
  postedAt: string | null;
  posted: boolean | null;
}

export default function ClientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [client, setClient] = useState<Client | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", logoUrl: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [stats, setStats] = useState<ClientStats>({
    postsThisMonth: 0,
    postsLimit: 12,
    pendingApprovals: 0,
    scheduledPosts: 0,
    engagementRate: null,
    engagementMetricsAvailable: false,
  });
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      router.push("/dashboard");
      return;
    }

    const fetchClientData = async () => {
      try {
        setLoading(true);
        
        const [clientResponse, dashboardResponse] = await Promise.all([
          fetch(`/api/clients/${clientId}?userId=${userId}`, { credentials: "include" }),
          fetch(`/api/clients/${clientId}/dashboard?userId=${userId}`, { credentials: "include" }),
        ]);
        
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          setClient(clientData.client);
        } else {
          const errorData = await clientResponse.json().catch(() => ({}));
          console.error("Failed to load client:", clientResponse.status, errorData);
          if (clientResponse.status === 401) {
            showToast.error(
              "Authentication required",
              "Please sign in to view this client."
            );
          }
        }

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          if (dashboardData.stats) {
            setStats(dashboardData.stats);
          }
          setPendingApprovals(Array.isArray(dashboardData.pendingApprovals) ? dashboardData.pendingApprovals : []);
          setUpcomingPosts(Array.isArray(dashboardData.upcomingPosts) ? dashboardData.upcomingPosts : []);
          setPublishedPosts(Array.isArray(dashboardData.publishedPosts) ? dashboardData.publishedPosts : []);
        } else {
          console.error("Failed to load client dashboard:", dashboardResponse.status);
        }
      } catch (error) {
        console.error("Failed to fetch client data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId, userId, router]);

  const openEditModal = () => {
    if (client) {
      setEditForm({
        name: client.name,
        email: client.email || "",
        logoUrl: client.logoUrl || "",
      });
      setEditModalOpen(true);
    }
  };

  const handleEditSave = async () => {
    if (!clientId || !userId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          logoUrl: editForm.logoUrl.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setEditModalOpen(false);
        showToast.success("Client updated", "Changes saved successfully.");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast.error("Update failed", err?.error || "Could not save changes.");
      }
    } catch {
      showToast.error("Error", "Failed to update client.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCopyApprovalLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      showToast.success("Link copied", "Approval link copied to clipboard.");
    } catch {
      showToast.error("Copy failed", "Could not copy the link.");
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        variant="inline"
        message="Loading client..."
        subtitle="Fetching client data"
      />
    );
  }

  if (!client) {
    return (
      <div className={`text-center py-12 transition-colors duration-300 bg-background`}>
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 text-muted-foreground`} />
        <h2 className={`text-xl font-semibold mb-2 text-foreground`}>Client not found</h2>
        <p className={`mb-6 text-muted-foreground`}>The client you&apos;re looking for doesn&apos;t exist.</p>
        <Button 
          onClick={() => router.push("/dashboard")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const postsRemaining = Math.max(stats.postsLimit - stats.postsThisMonth, 0);
  const postsPercentage = stats.postsLimit > 0
    ? (stats.postsThisMonth / stats.postsLimit) * 100
    : 0;

  return (
    <div className={`space-y-6 transition-colors duration-300 bg-background`}>
      {/* Client Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {client.logoUrl ? (
            <Image
              src={client.logoUrl}
              alt={client.name}
              width={48}
              height={48}
              className={`w-12 h-12 rounded-lg object-cover border border-border`}
              unoptimized={client.logoUrl.startsWith("http")}
              priority
              fetchPriority="high"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${"bg-purple-100 border-border dark:bg-purple-900/50 dark:border-slate-700"}`}>
              <Building2 className={`w-6 h-6 ${"text-foreground dark:text-purple-400"}`} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-bold text-foreground`}>{client.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={openEditModal}
                className={`h-8 w-8 shrink-0 ${"text-muted-foreground hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"}`}
                aria-label="Edit client"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            {client.email && (
              <p className={`text-sm mt-1 text-muted-foreground`}>
                {client.email}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {client.paymentStatus === "overdue" && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${"bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"}`}>
                  <AlertCircle className="w-3 h-3" />
                  Payment Due
                </span>
              )}
              {client.status === "paused" && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${"bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400"}`}>
                  <Clock className="w-3 h-3" />
                  Paused
                </span>
              )}
              {client.status === "active" && client.paymentStatus === "paid" && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${"bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"}`}>
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
            className={`transition-all duration-200 ${"border-purple-200 text-foreground hover:bg-muted hover:text-purple-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"}`}
          >
            Brand Voice
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/credits`)}
            className={`transition-all duration-200 ${"border-purple-200 text-foreground hover:bg-muted hover:text-purple-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"}`}
          >
            Credits
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
            className={`transition-all duration-200 ${"border-purple-200 text-foreground hover:bg-muted hover:text-purple-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"}`}
          >
            Tasks
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/content-ideas?clientId=${clientId}`)}
            className={`transition-all duration-200 ${
              "border-purple-200 text-foreground hover:bg-muted hover:text-purple-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
            }`}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Content Ideas
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/clients/${clientId}/generate`)}
            className="bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Content
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${"bg-white border-border hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Posts This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold text-foreground`}>
                {stats.postsThisMonth}
              </span>
              <span className={`text-sm text-muted-foreground`}>/ {stats.postsLimit}</span>
            </div>
            <div className="mt-2">
              <div className={`w-full rounded-full h-2 bg-accent`}>
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(postsPercentage, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 text-muted-foreground`}>
                {postsRemaining} posts remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${"bg-white border-border hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold text-foreground`}>
                {stats.pendingApprovals}
              </span>
            </div>
            <p className={`text-xs mt-1 text-muted-foreground`}>
              Awaiting client approval
            </p>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${"bg-white border-border hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Scheduled Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold text-foreground`}>
                {stats.scheduledPosts}
              </span>
            </div>
            <p className={`text-xs mt-1 text-muted-foreground`}>
              Upcoming posts
            </p>
          </CardContent>
        </Card>

        <Card className={`border transition-colors duration-300 hover:border-opacity-80 ${"bg-white border-border hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium text-muted-foreground`}>
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.engagementMetricsAvailable && stats.engagementRate != null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold text-foreground`}>
                    {stats.engagementRate}%
                  </span>
                  <TrendingUp className={`w-4 h-4 ${"text-green-600 dark:text-green-400"}`} />
                </div>
                <p className={`text-xs mt-1 text-muted-foreground`}>
                  Average across platforms
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold text-foreground`}>—</span>
                </div>
                <p className={`text-xs mt-1 text-muted-foreground`}>
                  Engagement metrics coming soon
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className={`p-1 ${
          "bg-accent dark:bg-slate-800"
        }`}>
          <TabsTrigger 
            value="calendar" 
            className={cn(
              "text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-gray-950 dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
            )}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            className={cn(
              "text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-gray-950 dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
            )}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approvals
            {stats.pendingApprovals > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                {stats.pendingApprovals}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className={cn(
              "text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-gray-950 dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
            )}
          >
            <FileText className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className={cn(
              "text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-gray-950 dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
            )}
          >
            <HistoryIcon className="w-4 h-4 mr-2" />
            History
            {publishedPosts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                {publishedPosts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className={cn(
              "text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-gray-950 dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
            )}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className={`border transition-colors duration-300 bg-card border-border`}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-base font-semibold text-foreground`}>
                Published
              </CardTitle>
              <p className={`text-sm mt-0.5 text-muted-foreground`}>
                {publishedPosts.length > 0
                  ? `${publishedPosts.length} post${publishedPosts.length !== 1 ? "s" : ""} delivered for ${client?.name ?? "this client"}`
                  : "Nothing has gone out yet"}
              </p>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              {publishedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    "bg-slate-100 text-muted-foreground dark:bg-slate-700/60 dark:text-slate-400"
                  }`}>
                    <HistoryIcon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm font-semibold text-foreground`}>
                    No history yet
                  </h3>
                  <p className={`mt-1 text-sm text-muted-foreground`}>
                    Once a scheduled post publishes, it&apos;s recorded here.
                  </p>
                </div>
              ) : (
                <div className="-mx-1">
                  {publishedPosts.map((post) => (
                    <PostRow
                      key={post.id}
                      platform={post.platform}
                      content={post.content}
                      // Show when it actually went out, not when it was queued.
                      scheduledFor={post.postedAt ?? post.scheduledFor}
                      status="published"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className={`border transition-colors duration-300 bg-card border-border`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 pb-4">
              <div className="min-w-0">
                <CardTitle className={`text-base font-semibold text-foreground`}>
                  Upcoming
                </CardTitle>
                <p className={`text-sm mt-0.5 text-muted-foreground`}>
                  {upcomingPosts.length > 0
                    ? `Next ${upcomingPosts.length} post${upcomingPosts.length !== 1 ? "s" : ""} in the queue`
                    : "Nothing scheduled yet"}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/dashboard/clients/${clientId}/calendar`)}
                size="sm"
                variant="outline"
                className={`shrink-0 ${"dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Full calendar
              </Button>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-10">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    "bg-slate-100 text-muted-foreground dark:bg-slate-700/60 dark:text-slate-400"
                  }`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm font-semibold text-foreground`}>
                    Nothing scheduled
                  </h3>
                  <p className={`mt-1 text-sm text-muted-foreground`}>
                    Queue a post and it&apos;ll show up here.
                  </p>
                  <Button
                    onClick={() => router.push(`/dashboard/schedule?clientId=${clientId}`)}
                    size="sm"
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule a post
                  </Button>
                </div>
              ) : (
                <div className="-mx-1">
                  {upcomingPosts.map((post) => (
                    <PostRow
                      key={post.id}
                      platform={post.platform}
                      content={post.content}
                      scheduledFor={post.scheduledFor}
                      status={
                        post.approvalStatus === "pending"
                          ? "pending"
                          : (post.approvalStatus as PostStatus | null) || "scheduled"
                      }
                      onClick={() => router.push(`/dashboard/clients/${clientId}/calendar`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card className={`border transition-colors duration-300 bg-card border-border`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <CardTitle className={`text-base font-semibold text-foreground`}>
                  Waiting on the client
                </CardTitle>
                {pendingApprovals.length > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400/15 px-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-0.5 text-muted-foreground`}>
                Only {client?.email || "the client's email on file"} can sign these off.
              </p>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-10">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
                  }`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm font-semibold text-foreground`}>
                    All clear
                  </h3>
                  <p className={`mt-1 text-sm max-w-xs mx-auto text-muted-foreground`}>
                    Schedule a post for this client to send an approval request.
                  </p>
                </div>
              ) : (
                <div className="-mx-1">
                  {pendingApprovals.map((approval) => (
                    <PostRow
                      key={approval.id}
                      platform={approval.platform}
                      content={approval.content}
                      scheduledFor={approval.scheduledFor}
                      status="pending"
                      actions={
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Copy approval link"
                            onClick={() => handleCopyApprovalLink(approval.approvalLink)}
                            className={"text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"}
                          >
                            <Copy className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Copy</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(approval.approvalLink, "_blank")}
                            className={"dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"}
                          >
                            <ExternalLink className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className={`border transition-colors duration-300 bg-card border-border`}>
            <CardHeader className={`border-b border-border bg-muted`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold text-foreground`}>Tasks</CardTitle>
                  <p className={`text-sm mt-1 text-muted-foreground`}>
                    Manage tasks and assignments for this client
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  View All Tasks
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className={`w-12 h-12 mx-auto mb-4 ${"text-purple-300 dark:text-purple-400"}`} />
                <h3 className={`text-lg font-semibold mb-2 text-foreground`}>Task Management</h3>
                <p className={`mb-4 text-muted-foreground`}>
                  Create and assign tasks to team members
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
                  className="bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground transition-all duration-200"
                >
                  Go to Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className={`border transition-colors duration-300 bg-card border-border`}>
            <CardHeader className={`border-b border-border bg-muted`}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold text-foreground`}>Analytics Dashboard</CardTitle>
                  <p className={`text-sm mt-1 text-muted-foreground`}>
                    Performance metrics and insights
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/clients/${clientId}/analytics`)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <FeatureComingSoon
                compact
                icon={BarChart3}
                title="Performance insights coming soon"
                description="Post counts and scheduling are live. Engagement metrics will appear here when platform analytics are connected."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Client Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => !editSaving && setEditModalOpen(false)}
        >
          <Card
            className={`w-full max-w-md border shadow-2xl mx-4 transition-colors duration-300 bg-card border-border`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className={`flex flex-row items-center justify-between pb-4 border-border`}>
              <CardTitle className={`text-lg text-foreground`}>Edit Client</CardTitle>
              <button
                onClick={() => !editSaving && setEditModalOpen(false)}
                className={`p-2 rounded-lg transition-colors ${"text-muted-foreground/70 hover:text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring outline-none ${"bg-white border-border text-foreground dark:bg-slate-700 dark:border-slate-600 dark:text-white"}`}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Client Email (Optional)
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring outline-none ${"bg-white border-border text-foreground dark:bg-slate-700 dark:border-slate-600 dark:text-white"}`}
                  placeholder="client@example.com"
                />
                <p className={`text-xs mt-1 text-muted-foreground`}>
                  Used for sending approval links directly to your client
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editForm.logoUrl}
                  onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus-visible:ring-ring outline-none ${"bg-white border-border text-foreground dark:bg-slate-700 dark:border-slate-600 dark:text-white"}`}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => !editSaving && setEditModalOpen(false)}
                  disabled={editSaving}
                  className={"dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={editSaving || !editForm.name.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
