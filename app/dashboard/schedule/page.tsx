"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertBanner, type AlertBannerItem } from "@/components/AlertBanner";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarView } from "@/components/CalendarView";
import { PostReminderModal } from "@/components/PostReminderModal";
import { ClientSelector } from "@/components/ClientSelector";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  Music2Icon,
  CalendarIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  Loader2Icon,
  BriefcaseIcon,
  YoutubeIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  AlertTriangleIcon,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok" | "youtube";

interface ScheduledPost {
  id: number;
  contentId: number | null;
  platform: string;
  content: string;
  scheduledFor: string;
  posted: boolean;
  postedAt: string | null;
  createdAt: string;
}

export default function DashboardSchedulePage() {
  const { userId } = useAuth();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<ContentType>("twitter");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [reminderPost, setReminderPost] = useState<ScheduledPost | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [approvalLinkModal, setApprovalLinkModal] = useState<{
    open: boolean;
    link: string;
  }>({ open: false, link: "" });
  const [scheduleClientId, setScheduleClientId] = useState<number | null>(null);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);

  const contentTypes: ContentType[] = ["twitter", "instagram", "linkedin", "tiktok", "youtube"];
  
  // YouTube-specific state
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState("");
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [youtubeContentType, setYoutubeContentType] = useState<"rain_sounds" | "sleep_sounds" | "ambient_sounds" | "white_noise">("rain_sounds");
  const [youtubeDuration, setYoutubeDuration] = useState<number>(30);
  const [youtubeQuality, setYoutubeQuality] = useState<"high" | "medium" | "low">("high");
  const [youtubePrivacy, setYoutubePrivacy] = useState<"public" | "unlisted" | "private">("public");
  
  // Progress tracking state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    percentage: number;
    currentTime: number;
    totalDuration: number;
    status: string;
    message?: string;
    timeRemaining?: number;
  } | null>(null);

  // Block schedule when payment overdue or credits exceeded
  const [alertBanners, setAlertBanners] = useState<AlertBannerItem[]>([]);
  const actionsBlocked = useMemo(
    () => alertBanners.some((b) => b.variant === "payment_overdue" || b.variant === "credits_exceeded"),
    [alertBanners]
  );

  const resetScheduleModalState = useCallback(() => {
    setShowScheduleModal(false);
    setEditingPost(null);
    setYoutubeVideoTitle("");
    setYoutubeDescription("");
    setYoutubeContentType("rain_sounds");
    setYoutubeDuration(30);
    setYoutubeQuality("high");
    setYoutubePrivacy("public");
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/activity", { credentials: "include" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) return;
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const content = params.get("content");
      const platform = params.get("platform");
      const reminderId = params.get("reminder");
      const clientIdParam = params.get("clientId");

      if (clientIdParam) {
        const parsedClientId = parseInt(clientIdParam, 10);
        if (!Number.isNaN(parsedClientId)) {
          setScheduleClientId(parsedClientId);
        }
      }
      
      if (content) {
        setSelectedContent(decodeURIComponent(content));
        if (platform && contentTypes.includes(platform as ContentType)) {
          setSelectedPlatform(platform as ContentType);
        }
        setShowScheduleModal(true);
        window.history.replaceState({}, "", "/dashboard/schedule");
      }
      
      // Handle reminder modal
      if (reminderId) {
        const postId = parseInt(reminderId);
        const post = scheduledPosts.find(p => p.id === postId);
        if (post) {
          setReminderPost(post);
          setShowReminderModal(true);
        }
        window.history.replaceState({}, "", "/dashboard/schedule");
      }
    }
  }, [scheduledPosts]);

  // Brand tint carries the platform, matching the palette in components/PostRow.tsx.
  // These sit on white/slate surfaces, so the icon must never be white.
  const PLATFORM_ICONS: Record<string, { Icon: typeof TwitterIcon; fg: string }> = {
    twitter: { Icon: TwitterIcon, fg: "text-slate-500" },
    instagram: { Icon: InstagramIcon, fg: "text-fuchsia-500" },
    linkedin: { Icon: LinkedinIcon, fg: "text-sky-500" },
    tiktok: { Icon: Music2Icon, fg: "text-cyan-500" },
    youtube: { Icon: YoutubeIcon, fg: "text-red-500" },
  };

  const getPlatformIcon = (platform: string) => {
    const meta = PLATFORM_ICONS[(platform || "").toLowerCase()];
    if (!meta) return null;
    const { Icon, fg } = meta;
    return <Icon className={`w-4 h-4 shrink-0 ${fg}`} />;
  };

  // Get platform posting status (auto-post vs reminder)
  const getPlatformPostingStatus = (platform: string): { type: "auto" | "reminder"; message: string } => {
    const platformLower = platform.toLowerCase();
    
    switch (platformLower) {
      case "youtube":
        return {
          type: youtubeConnected ? "auto" : "reminder",
          message: youtubeConnected ? "Auto-posts" : "Connect account to auto-post",
        };
      case "twitter":
        return {
          type: twitterConnected ? "auto" : "reminder",
          message: twitterConnected ? "Auto-posts" : "Connect account to auto-post",
        };
      case "instagram":
        return {
          type: instagramConnected ? "auto" : "reminder",
          message: instagramConnected ? "Auto-posts" : "Connect account to auto-post",
        };
      case "linkedin":
        return {
          type: "reminder",
          message: "Manual posting (requires Company Page)",
        };
      case "tiktok":
        return {
          type: "reminder",
          message: "Manual posting (no API available)",
        };
      default:
        return {
          type: "reminder",
          message: "Manual posting",
        };
    }
  };
  
  // Check platform connection status
  useEffect(() => {
    const checkConnections = async () => {
      if (!userId) return;
      
      try {
        // Check YouTube
        const youtubeResponse = await fetch(`/api/youtube/status${userId ? `?userId=${userId}` : ''}`);
        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json();
          setYoutubeConnected(youtubeData.connected || false);
        }
        
        // Check Twitter
        const twitterResponse = await fetch(`/api/twitter/status${userId ? `?userId=${userId}` : ''}`);
        if (twitterResponse.ok) {
          const twitterData = await twitterResponse.json();
          setTwitterConnected(twitterData.connected || false);
        }
        
        // Check Instagram
        const instagramResponse = await fetch(`/api/instagram/status${userId ? `?userId=${userId}` : ''}`);
        if (instagramResponse.ok) {
          const instagramData = await instagramResponse.json();
          setInstagramConnected(instagramData.connected || false);
        }
      } catch (error) {
        console.error("Error checking platform connections:", error);
      }
    };
    
    checkConnections();
  }, [userId]);

  const handleCopyApprovalLink = useCallback(async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      showToast.success(
        "Approval link copied",
        "Share this with your client if the email is delayed or goes to spam"
      );
    } catch {
      showToast.error("Copy failed", "Please select and copy the link manually");
    }
  }, []);

  const fetchScheduledPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/schedule${userId ? `?userId=${userId}` : ''}`;
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(Array.isArray(data) ? data : []);
      } else {
        setScheduledPosts([]);
      }
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      setScheduledPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchScheduledPosts();
    }
  }, [userId, fetchScheduledPosts]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = useCallback((): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get minimum time for today (current time + 1 minute)
  const getMinTimeForToday = useCallback((): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleSchedule = useCallback(async () => {
    if (actionsBlocked) {
      showToast.error("Actions blocked", "Resolve payment or credits issues to schedule posts.");
      return;
    }
    // YouTube posts require different handling
    if (selectedPlatform === "youtube") {
      if (!youtubeVideoTitle.trim() || !scheduledDate || !scheduledTime) {
        showToast.error("Missing fields", "Please fill in video title, date, and time");
        return;
      }
      
      if (!youtubeConnected) {
        showToast.error("YouTube not connected", "Please connect your YouTube account in Settings first");
        return;
      }

      setIsSubmitting(true);
      try {
        // Create date from user's local time selection
        // Note: new Date() with string interprets in local timezone, then toISOString() converts to UTC
        // This is correct - YouTube API expects UTC times
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();
        
        // YouTube requires 15 minutes minimum, but we need 40 minutes to account for:
        // - Video generation time (15-20 minutes for a 30-min video)
        // - Timezone differences (Nigeria UTC+1 vs YouTube UTC)
        // - Clock skew between servers
        // - Network and processing delays
        const MINIMUM_MINUTES = 40;
        const minScheduledTime = new Date(now.getTime() + MINIMUM_MINUTES * 60 * 1000);
        
        if (scheduledDateTime < now) {
          showToast.error("Invalid time", "Scheduled time must be in the future");
          setIsSubmitting(false);
          return;
        }
        
        // Check if scheduled time meets the minimum requirement
        if (scheduledDateTime < minScheduledTime) {
          const minTimeStr = minScheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const minutesUntilMin = Math.round((minScheduledTime.getTime() - now.getTime()) / 60000);
          showToast.error(
            "Invalid scheduled time", 
            `YouTube requires scheduled videos to be at least 15 minutes in the future. However, video generation takes 15-20 minutes, and we need to account for timezone differences. Please schedule for at least ${minutesUntilMin} minutes from now (${minTimeStr} or later).`
          );
          setIsSubmitting(false);
          return;
        }

        // Call YouTube generate-and-upload API
        const response = await fetch("/api/youtube/generate-and-upload", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: youtubeContentType,
            title: youtubeVideoTitle,
            description: youtubeDescription || `${youtubeVideoTitle}\n\nPerfect for sleep, study, meditation, and relaxation.`,
            durationMinutes: youtubeDuration,
            quality: youtubeQuality,
            privacyStatus: youtubePrivacy,
            scheduledPublishTime: scheduledDateTime.toISOString(),
            userId: userId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // If jobId is returned, start tracking progress
          if (data.jobId) {
            setCurrentJobId(data.jobId);
            // Keep modal open to show progress
          } else {
            // No progress tracking, close modal immediately
            setShowScheduleModal(false);
            setEditingPost(null);
            setYoutubeVideoTitle("");
            setYoutubeDescription("");
            setScheduledDate("");
            setScheduledTime("");
            fetchScheduledPosts();
            showToast.success(
              "Video scheduled!",
              `Your YouTube video "${youtubeVideoTitle}" is scheduled for ${formatDateTime(scheduledDateTime.toISOString())}`
            );
          }
        } else {
          const error = await response.json();
          showToast.error("Failed to schedule video", error.error || error.details || "Please try again");
        }
      } catch (error: unknown) {
        console.error("Error scheduling YouTube video:", error);
        showToast.error("Failed to schedule", error instanceof Error ? error.message : "An error occurred. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Regular text-based posts (Twitter, Instagram, LinkedIn, TikTok)
    if (!selectedContent.trim() || !scheduledDate || !scheduledTime) {
      showToast.error("Missing fields", "Please fill in all fields to schedule your post");
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (scheduledDateTime < new Date()) {
        showToast.error("Invalid time", "Scheduled time must be in the future");
        setIsSubmitting(false);
        return;
      }

      const method = editingPost ? "PUT" : "POST";
      const body = editingPost
        ? {
            id: editingPost.id,
            content: selectedContent,
            platform: selectedPlatform,
            scheduledFor: scheduledDateTime.toISOString(),
            userId: userId,
          }
        : {
            content: selectedContent,
            platform: selectedPlatform,
            scheduledFor: scheduledDateTime.toISOString(),
            userId: userId,
            ...(scheduleClientId != null && { clientId: scheduleClientId }),
          };

      const response = await fetch("/api/schedule", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setShowScheduleModal(false);
        setEditingPost(null);
        setSelectedContent("");
        setScheduledDate("");
        setScheduledTime("");
        fetchScheduledPosts();
        if (data.approvalLink) {
          setApprovalLinkModal({ open: true, link: data.approvalLink });
          // Say plainly whether the client was actually emailed — "when
          // possible" left it ambiguous whether anything was sent.
          if (data.approvalEmailWarning) {
            showToast.warning(
              editingPost ? "Post updated — not sent" : "Post scheduled — not sent",
              data.approvalEmailWarning
            );
          } else {
            showToast.success(
              editingPost ? "Post updated!" : "Post scheduled!",
              "Approval request emailed to your client."
            );
          }
        } else {
          showToast.success(
            editingPost ? "Post updated!" : "Post scheduled!",
            `Your ${selectedPlatform} post is scheduled for ${formatDateTime(scheduledDateTime.toISOString())}`
          );
        }
      } else {
        const error = await response.json();
        showToast.error("Failed to schedule", error.error || "Please try again");
      }
    } catch (error) {
      console.error("Error scheduling post:", error);
      showToast.error("Failed to schedule", "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedContent, 
    selectedPlatform, 
    scheduledDate, 
    scheduledTime, 
    editingPost, 
    fetchScheduledPosts, 
    formatDateTime, 
    userId,
    youtubeVideoTitle,
    youtubeDescription,
    youtubeContentType,
    youtubeDuration,
    youtubeQuality,
    youtubePrivacy,
    youtubeConnected,
    actionsBlocked,
    scheduleClientId,
  ]);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteConfirm({ open: true, id });
  }, []);

  const handleMarkPosted = useCallback(
    async (id: number) => {
      try {
        const response = await fetch("/api/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, posted: true, userId }),
        });
        if (response.ok) {
          showToast.success("Marked as posted", "Post moved to published history");
          fetchScheduledPosts();
        } else {
          const err = await response.json().catch(() => ({}));
          showToast.error("Couldn’t update", err.error || "Try again");
        }
      } catch {
        showToast.error("Error", "Failed to mark as posted");
      }
    },
    [userId, fetchScheduledPosts]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });

    try {
      if (!userId) {
        showToast.error("Authentication required", "Please sign in to delete posts");
        return;
      }
      
      const url = `/api/schedule?id=${id}&userId=${userId}`;
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchScheduledPosts();
        showToast.success("Post deleted", "The scheduled post has been removed");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to delete post";
        showToast.error("Failed to delete", errorMessage);
      }
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      showToast.error("Failed to delete", "An error occurred. Please try again.");
    }
  }, [deleteConfirm.id, fetchScheduledPosts, userId]);

  const handleEdit = useCallback((post: ScheduledPost) => {
    setEditingPost(post);
    if (post.platform === "youtube") {
      // YouTube posts can't be edited (they're already generated and uploaded)
      showToast.error("Cannot edit", "YouTube videos cannot be edited after scheduling. Please delete and create a new one.");
      return;
    }
    setSelectedContent(post.content);
    setSelectedPlatform(post.platform as ContentType);
    const date = new Date(post.scheduledFor);
    setScheduledDate(date.toISOString().split("T")[0]);
    setScheduledTime(date.toTimeString().slice(0, 5));
    setShowScheduleModal(true);
  }, []);

  const getTimeUntil = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Past due";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const upcomingPosts = useMemo(
    () => scheduledPosts.filter((p) => !p.posted && new Date(p.scheduledFor) > new Date()),
    [scheduledPosts]
  );
  const pastPosts = useMemo(
    () => scheduledPosts.filter((p) => p.posted || new Date(p.scheduledFor) <= new Date()),
    [scheduledPosts]
  );


  // Unused functions - commented out
  // const getPlatformColor = (platform: string) => {
  //   switch (platform.toLowerCase()) {
  //     case "twitter":
  //       return "bg-gray-50 border-gray-200 text-gray-950";
  //     case "instagram":
  //       return "bg-pink-50 border-pink-200 text-pink-900";
  //     case "linkedin":
  //       return "bg-blue-50 border-blue-200 text-blue-900";
  //     case "tiktok":
  //       return "bg-gray-50 border-gray-200 text-gray-950";
  //     case "youtube":
  //       return "bg-red-50 border-red-200 text-red-900";
  //     default:
  //       return "bg-gray-50 border-gray-200 text-gray-950";
  //   }
  // };

  // const getPlatformIconBg = (platform: string) => {
  //   switch (platform.toLowerCase()) {
  //     case "twitter":
  //       return "bg-black";
  //     case "instagram":
  //       return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500";
  //     case "linkedin":
  //       return "bg-blue-600";
  //     case "tiktok":
  //       return "bg-black";
  //     case "youtube":
  //       return "bg-red-600";
  //     default:
  //       return "bg-gray-500";
  //   }
  // };

  return (
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto transition-colors duration-300 bg-background`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-foreground`}>Schedule Posts</h1>
          <p className={"text-muted-foreground"}>We post for you automatically</p>
        </div>
        <Button
          onClick={() => {
            if (actionsBlocked) {
              showToast.error("Actions blocked", "Resolve payment or credits issues to schedule posts.");
              return;
            }
            setEditingPost(null);
            setSelectedContent("");
            setSelectedPlatform("twitter");
            setScheduledDate("");
            setScheduledTime("");
            // Reset YouTube state
            setYoutubeVideoTitle("");
            setYoutubeDescription("");
            setYoutubeContentType("rain_sounds");
            setYoutubeDuration(30);
            setYoutubeQuality("high");
            setYoutubePrivacy("public");
            setShowScheduleModal(true);
          }}
          disabled={actionsBlocked}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <AlertBanner items={alertBanners} blockActions={actionsBlocked} className="mb-2" />

      {/* View Tabs */}
      <div className={`rounded-xl p-1 border transition-colors duration-300 ${
        "bg-gray-100 border-gray-200 dark:bg-slate-800 dark:border-slate-700"
      }`}>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              viewMode === "calendar"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white dark:shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Upcoming Posts</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white dark:shadow-sm"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">This Week Scheduled</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium text-muted-foreground`}>Upcoming</p>
            <p className={`text-2xl font-bold text-foreground`}>{upcomingPosts.length}</p>
          </CardContent>
        </Card>
        <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium text-muted-foreground`}>Posted</p>
            <p className={`text-2xl font-bold text-foreground`}>{pastPosts.filter((p) => p.posted).length}</p>
          </CardContent>
        </Card>
        <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium text-muted-foreground`}>Total</p>
            <p className={`text-2xl font-bold text-foreground`}>{scheduledPosts.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2Icon className={`w-8 h-8 animate-spin mx-auto mb-4 ${
            "text-gray-700 dark:text-purple-400"
          }`} />
          <p className={"text-muted-foreground"}>Loading scheduled posts...</p>
        </div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        upcomingPosts.length === 0 ? (
          <div className={`text-center py-12 border rounded-xl transition-colors duration-300 bg-card border-border`}>
            <CalendarIcon className={`w-12 h-12 mx-auto mb-3 text-muted-foreground/70`} />
            <h3 className={`text-lg font-semibold mb-1.5 text-foreground`}>No scheduled posts</h3>
            <p className={`text-sm mb-4 text-muted-foreground`}>
              Schedule your first post to see it on the calendar
            </p>
            <Button
              onClick={() => setShowScheduleModal(true)}
              className={`rounded-xl transition-all duration-200 ${
                "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
              }`}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </div>
        ) : (
          <CalendarView
            events={upcomingPosts.map((post) => ({
              id: post.id,
              date: new Date(post.scheduledFor),
              title: `${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post`,
              platform: post.platform,
              content: post.content,
            }))}
            onEventClick={(event) => {
              const post = upcomingPosts.find((p) => p.id === event.id);
              if (post) handleEdit(post);
            }}
          />
        )
      ) : (
        <>
          {/* List View - Upcoming Posts */}
          {upcomingPosts.length > 0 && (
            <div>
              <h2 className={`text-xl font-bold mb-6 text-foreground`}>Upcoming</h2>
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <Card
                    key={post.id}
                    className={`border rounded-xl transition-all duration-200 ${
                      "bg-white border-gray-200 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(post.platform)}
                            <span className={`text-sm font-semibold capitalize text-foreground`}>
                              {post.platform}
                            </span>
                          </div>
                          {(() => {
                            const status = getPlatformPostingStatus(post.platform);
                            return (
                              <span
                                className={`px-2 py-0.5 text-xs rounded-lg border transition-colors duration-300 ${
                                  status.type === "auto"
                                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800"
                                    : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800"
                                }`}
                                title={status.message}
                              >
                                {status.type === "auto" ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" />
                                    Auto-posts
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    Reminder
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                          <span className={`px-2 py-0.5 text-xs rounded-lg border transition-colors duration-300 ${
                            "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                          }`}>
                            {getTimeUntil(post.scheduledFor)}
                          </span>
                        </div>
                          <span className={`text-xs text-muted-foreground`}>
                          {formatDateTime(post.scheduledFor)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleEdit(post)}
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                            "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                          }`}
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(post.id)}
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                            "border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-500 dark:hover:text-red-300"
                          }`}
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                      <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                        "bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-slate-700"
                      }`}>
                        {post.platform === "youtube" ? (
                          <p className={`flex items-center gap-2 text-sm leading-relaxed text-foreground`}>
                            <YoutubeIcon className="h-4 w-4 shrink-0" />
                            YouTube Video - {post.content || "Video scheduled"}
                          </p>
                        ) : (
                          <pre className={`whitespace-pre-wrap text-sm leading-relaxed line-clamp-2 text-foreground`}>
                            {post.content}
                          </pre>
                        )}
                    </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Posts */}
          {pastPosts.length > 0 && (
            <div>
              <h2 className={`text-xl font-bold mb-6 text-foreground`}>Past</h2>
              <div className="space-y-4">
                {pastPosts.map((post) => (
                  <Card
                    key={post.id}
                    className={`border rounded-xl opacity-80 transition-colors duration-300 bg-muted/50 border-border`}
                  >
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                          <span className={`text-sm font-medium capitalize text-foreground/80`}>
                          {post.platform}
                        </span>
                        {post.posted ? (
                            <span className={`px-2 py-0.5 text-xs rounded-lg border transition-colors duration-300 ${
                              "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800"
                            }`}>
                            Posted
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 text-xs rounded-lg border ${
                            "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}>
                            Due
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!post.posted ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPosted(post.id)}
                            className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Mark posted
                          </Button>
                        ) : null}
                        <span className={`text-xs text-muted-foreground`}>
                          {formatDateTime(post.scheduledFor)}
                        </span>
                      </div>
                    </div>
                      {post.platform === "youtube" ? (
                        <p className={`flex items-center gap-2 text-xs leading-relaxed text-foreground/80`}>
                          <YoutubeIcon className="h-3.5 w-3.5 shrink-0" />
                          YouTube Video - {post.content || "Video scheduled"}
                        </p>
                      ) : (
                        <pre className={`whitespace-pre-wrap text-xs leading-relaxed line-clamp-2 text-foreground/80`}>
                      {post.content}
                    </pre>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {scheduledPosts.length === 0 && (
            <div className={`text-center py-12 border rounded-xl transition-colors duration-300 bg-card border-border`}>
              <CalendarIcon className={`w-12 h-12 mx-auto mb-3 text-muted-foreground/70`} />
              <h3 className={`text-lg font-semibold mb-1.5 text-foreground`}>No scheduled posts</h3>
              <p className={`text-sm mb-4 text-muted-foreground`}>
                We post for you automatically
              </p>
              <Button
                onClick={() => setShowScheduleModal(true)}
                className={`rounded-xl transition-all duration-200 ${
                  "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
                }`}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            </div>
          )}
        </>
      )}

      {/* Schedule Modal */}
      <Dialog
        open={showScheduleModal}
        onOpenChange={(open) => {
          if (!open) resetScheduleModalState();
          else setShowScheduleModal(true);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-2xl">
          <DialogHeader className={`p-4 sm:p-6 border-b shrink-0 border-border`}>
            <DialogTitle>
              {editingPost ? "Edit Post" : "Schedule Post"}
            </DialogTitle>
          </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>Platform</label>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPlatform(type)}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl border transition-all duration-200 ${
                        selectedPlatform === type
                          ? "border-gray-900 bg-gray-50 text-gray-900 dark:border-purple-500 dark:bg-purple-900/50 dark:text-purple-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {getPlatformIcon(type)}
                      <span className="text-xs capitalize hidden sm:inline">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlatform !== "youtube" && (
                <div>
                  <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>
                    Client
                  </label>
                  <ClientSelector
                    userId={userId}
                    selectedClientId={scheduleClientId}
                    onClientChange={setScheduleClientId}
                    autoSelectFirst={false}
                  />
                  <p className={`mt-1.5 text-xs text-muted-foreground`}>
                    Select a client to send the post for approval. Leave empty to schedule without approval.
                  </p>
                </div>
              )}

              {/* YouTube Connection Warning */}
              {selectedPlatform === "youtube" && !youtubeConnected && (
                <div className={`p-3 border rounded-xl transition-colors duration-300 ${
                  "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
                }`}>
                  <p className={`flex items-start gap-2 text-sm ${
                    "text-yellow-800 dark:text-yellow-300"
                  }`}>
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>YouTube account not connected. Please connect your YouTube account in Settings first.</span>
                  </p>
                </div>
              )}

              {/* YouTube Video Generation Form */}
              {selectedPlatform === "youtube" ? (
                <>
                  <div>
                    <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>Video Title *</label>
                    <input
                      type="text"
                      value={youtubeVideoTitle}
                      onChange={(e) => setYoutubeVideoTitle(e.target.value)}
                      placeholder="Enter video title..."
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                        "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 dark:hover:border-slate-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>Description</label>
                    <textarea
                      value={youtubeDescription}
                      onChange={(e) => setYoutubeDescription(e.target.value)}
                      placeholder="Enter video description (optional)..."
                      className={`w-full px-4 py-3 border rounded-xl resize-none text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                        "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 dark:hover:border-slate-500"
                      }`}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-2 block">Content Type</Label>
                      <Select
                        value={youtubeContentType}
                        onValueChange={(value) =>
                          setYoutubeContentType(
                            value as "rain_sounds" | "sleep_sounds" | "ambient_sounds" | "white_noise"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rain_sounds">Rain Sounds</SelectItem>
                          <SelectItem value="sleep_sounds">Sleep Sounds</SelectItem>
                          <SelectItem value="ambient_sounds">Ambient Sounds</SelectItem>
                          <SelectItem value="white_noise">White Noise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>Duration (minutes)</label>
                      <input
                        type="number"
                        value={youtubeDuration}
                        onChange={(e) => setYoutubeDuration(parseInt(e.target.value) || 30)}
                        min={1}
                        max={480}
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                          "bg-white border-gray-300 text-gray-900 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:border-slate-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-2 block">Quality</Label>
                      <Select
                        value={youtubeQuality}
                        onValueChange={(value) =>
                          setYoutubeQuality(value as "high" | "medium" | "low")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Privacy</Label>
                      <Select
                        value={youtubePrivacy}
                        onValueChange={(value) =>
                          setYoutubePrivacy(value as "public" | "unlisted" | "private")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                /* Regular Text Content Form */
                <>
              <div>
                    <label className={`block text-xs font-semibold mb-2 text-foreground/80`}>Content</label>
                <textarea
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                      className={`w-full px-4 py-3 border rounded-xl resize-none text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                        "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 dark:hover:border-slate-500"
                      }`}
                  rows={6}
                />
                    <div className={`mt-1.5 text-xs text-right text-muted-foreground`}>
                  {selectedContent.length} chars
                </div>
              </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 text-foreground/80`}>Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getTodayDate()}
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                      "bg-white border-gray-300 text-gray-900 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:border-slate-500"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 text-foreground/80`}>
                    Time
                    {selectedPlatform === "youtube" && scheduledDate === getTodayDate() && (
                      <span className={`font-normal ml-1 text-muted-foreground`}>(min 40 min from now)</span>
                    )}
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={scheduledDate === getTodayDate() ? (() => {
                      // For YouTube, require 40 minutes minimum to account for:
                      // - Video generation time (15-20 minutes)
                      // - Timezone differences (Nigeria UTC+1 vs YouTube UTC)
                      // - Clock skew and processing delays
                      // For other platforms, 1 minute is fine
                      if (selectedPlatform === "youtube") {
                        const now = new Date();
                        const minTime = new Date(now.getTime() + 40 * 60 * 1000); // 40 minutes from now
                        const hours = String(minTime.getHours()).padStart(2, '0');
                        const minutes = String(minTime.getMinutes()).padStart(2, '0');
                        return `${hours}:${minutes}`;
                      }
                      return getMinTimeForToday();
                    })() : undefined}
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                      "bg-white border-gray-300 text-gray-900 hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:border-slate-500"
                    }`}
                  />
                  {selectedPlatform === "youtube" && scheduledDate === getTodayDate() && (
                    <p className={`text-xs mt-1 text-muted-foreground`}>
                      YouTube requires scheduled videos to be at least 15 minutes in the future. We require 40+ minutes to account for video generation time (15-20 min), timezone differences, and processing delays.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Display */}
            {progress && currentJobId && (
              <div className={`px-4 sm:px-6 pb-4 border-t transition-colors duration-300 ${
                "border-gray-200 bg-muted/50 dark:border-slate-700 dark:bg-purple-950/30"
              }`}>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2Icon className={`w-4 h-4 animate-spin ${
                        "text-foreground dark:text-purple-400"
                      }`} />
                      <span className={`text-sm font-semibold text-foreground`}>
                        {progress.status === "generating" ? "Generating Video..." : 
                         progress.status === "uploading" ? "Uploading to YouTube..." :
                         progress.status === "completed" ? "Completed!" :
                         "Processing..."}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold text-foreground/80`}>
                      {progress.percentage}%
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className={`flex items-center justify-between text-xs text-muted-foreground`}>
                    <span>
                      {formatTime(progress.currentTime)} / {formatTime(progress.totalDuration)}
                    </span>
                    {progress.timeRemaining && progress.timeRemaining > 0 && (
                      <span>
                        ~{Math.ceil(progress.timeRemaining / 60)} min remaining
                      </span>
                    )}
                  </div>
                  {progress.status === "completed" && (
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setShowScheduleModal(false);
                          setEditingPost(null);
                          setCurrentJobId(null);
                          setProgress(null);
                          setYoutubeVideoTitle("");
                          setYoutubeDescription("");
                          setScheduledDate("");
                          setScheduledTime("");
                          fetchScheduledPosts();
                        }}
                        size="sm"
                        className="w-full bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground rounded-xl transition-all duration-200"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 transition-colors duration-300 border-border bg-muted`}>
              <Button
                onClick={resetScheduleModalState}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={
                  actionsBlocked ||
                  isSubmitting || 
                  !scheduledDate || 
                  !scheduledTime ||
                  (selectedPlatform === "youtube" 
                    ? (!youtubeVideoTitle.trim() || !youtubeConnected)
                    : !selectedContent.trim())
                }
                size="sm"
                className={`w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-xl transition-all duration-200 ${
                  "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {selectedPlatform === "youtube" ? "Generating & Scheduling..." : editingPost ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  selectedPlatform === "youtube" ? "Generate & Schedule Video" : editingPost ? "Update" : "Schedule"
                )}
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Post Reminder Modal */}
      <PostReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderPost(null);
        }}
        onMarkedPosted={fetchScheduledPosts}
        post={reminderPost ? {
          id: reminderPost.id,
          platform: reminderPost.platform,
          content: reminderPost.content,
          scheduledFor: reminderPost.scheduledFor,
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Scheduled Post"
        description="Are you sure you want to delete this scheduled post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Approval link — manual fallback when client email is delayed or missing */}
      <Dialog
        open={approvalLinkModal.open}
        onOpenChange={(open) =>
          !open && setApprovalLinkModal({ open: false, link: "" })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client approval link</DialogTitle>
            <DialogDescription className="leading-relaxed">
              We&apos;ve attempted to email your client. Copy this link if they
              need it manually — it opens their approval portal.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-3 py-2 text-xs break-all text-gray-700 dark:text-slate-300">
            {approvalLinkModal.link}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalLinkModal({ open: false, link: "" })}
            >
              Done
            </Button>
            <Button
              onClick={() => handleCopyApprovalLink(approvalLinkModal.link)}
              className="bg-gray-950 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 text-white"
            >
              <CopyIcon className="w-4 h-4 mr-2" />
              Copy approval link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KeyboardShortcuts />
    </div>
  );
}
