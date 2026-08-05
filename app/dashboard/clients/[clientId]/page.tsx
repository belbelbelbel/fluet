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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { FeatureComingSoon } from "@/components/FeatureComingSoon";

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

export default function ClientDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  const formatScheduledDate = (iso: string | null) => {
    if (!iso) return "Not scheduled";
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center flex flex-col items-center">
          <div className="w-28 h-28 flex items-center justify-center animate-pulse">
            <Building2 className={`w-28 h-28 ${
              isDark ? "text-slate-500" : "text-gray-300"
            }`} />
          </div>
          <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
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
        <p className={`mb-6 ${isDark ? "text-slate-400" : "text-gray-600"}`}>The client you&apos;re looking for doesn&apos;t exist.</p>
        <Button 
          onClick={() => router.push("/dashboard")}
          className={isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
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
              unoptimized={client.logoUrl.startsWith("http")}
              priority
              fetchPriority="high"
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${isDark ? "bg-purple-900/50 border-slate-700" : "bg-purple-100 border-gray-200"}`}>
              <Building2 className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{client.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={openEditModal}
                className={`h-8 w-8 shrink-0 ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                aria-label="Edit client"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
            {client.email && (
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {client.email}
              </p>
            )}
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
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-900"}`}
          >
            Brand Voice
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/credits`)}
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-900"}`}
          >
            Credits
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${clientId}/tasks`)}
            className={`transition-all duration-200 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-900"}`}
          >
            Tasks
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/content-ideas?clientId=${clientId}`)}
            className={`transition-all duration-200 ${
              isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white" : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-900"
            }`}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Content Ideas
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
            {stats.engagementMetricsAvailable && stats.engagementRate != null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {stats.engagementRate}%
                  </span>
                  <TrendingUp className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                </div>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Average across platforms
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>—</span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
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
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-purple-400" : "text-purple-300"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>No upcoming posts</h3>
                  <p className={`mb-4 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                    Schedule a post for this client to see it here.
                  </p>
                  <Button
                    onClick={() => router.push(`/dashboard/schedule?clientId=${clientId}`)}
                    className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              ) : (
                <ul className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-200"}`}>
                  {upcomingPosts.map((post) => (
                    <li key={post.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-700"
                        }`}>
                          {post.platform}
                        </span>
                        {post.approvalStatus === "pending" && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-800"
                          }`}>
                            Awaiting approval
                          </span>
                        )}
                        <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                          {formatScheduledDate(post.scheduledFor)}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                        {post.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card className={`border transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : "text-gray-950"}>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingApprovals.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  <CheckCircle2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-slate-500" : "text-gray-300"}`} />
                  <p>No pending approvals</p>
                  <p className={`text-xs mt-2 max-w-sm mx-auto ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Schedule a post with this client selected to send an approval request and email.
                  </p>
                </div>
              ) : (
                <ul className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-200"}`}>
                  {pendingApprovals.map((approval) => (
                    <li
                      key={approval.id}
                      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-800"
                        }`}>
                          {approval.platform}
                        </span>
                        <p className={`text-sm mt-2 line-clamp-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                          {approval.content}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                          Scheduled: {formatScheduledDate(approval.scheduledFor)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyApprovalLink(approval.approvalLink)}
                          className={isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : ""}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy link
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => window.open(approval.approvalLink, "_blank")}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open portal
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
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
              <FeatureComingSoon
                compact
                isDark={isDark}
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
            className={`w-full max-w-md border shadow-2xl mx-4 transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className={`flex flex-row items-center justify-between pb-4 ${isDark ? "border-slate-700" : "border-gray-200"}`}>
              <CardTitle className={`text-lg ${isDark ? "text-white" : "text-gray-950"}`}>Edit Client</CardTitle>
              <button
                onClick={() => !editSaving && setEditModalOpen(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  Client Email (Optional)
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="client@example.com"
                />
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Used for sending approval links directly to your client
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editForm.logoUrl}
                  onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => !editSaving && setEditModalOpen(false)}
                  disabled={editSaving}
                  className={isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : ""}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={editSaving || !editForm.name.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
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
