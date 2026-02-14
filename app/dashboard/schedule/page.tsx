"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarView } from "@/components/CalendarView";
import { PostReminderModal } from "@/components/PostReminderModal";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  CalendarIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  XIcon,
  Loader2Icon,
  BriefcaseIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
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

// Dummy data for calendar view
const dummyScheduledPosts: ScheduledPost[] = [
  {
    id: 1,
    contentId: null,
    platform: "linkedin",
    content: "Excited to share our latest product update! 🚀",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T09:00:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    contentId: null,
    platform: "twitter",
    content: "Just launched a new feature! Check it out 👇",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T13:30:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    contentId: null,
    platform: "instagram",
    content: "Beautiful sunset today! 🌅 #photography",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T12:30:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    contentId: null,
    platform: "tiktok",
    content: "Quick tutorial on how to use our new feature!",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T16:00:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    contentId: null,
    platform: "linkedin",
    content: "Industry insights: What's trending in 2024",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T18:30:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    contentId: null,
    platform: "twitter",
    content: "Weekend vibes! What are you working on? 💻",
    scheduledFor: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().replace(/T\d{2}:\d{2}:\d{2}/, "T10:00:00"),
    posted: false,
    postedAt: null,
    createdAt: new Date().toISOString(),
  },
];

export default function DashboardSchedulePage() {
  const { userId } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const content = params.get("content");
      const platform = params.get("platform");
      const reminderId = params.get("reminder");
      
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <TwitterIcon className="w-4 h-4 text-white" />;
      case "instagram":
        return <InstagramIcon className="w-4 h-4 text-white" />;
      case "linkedin":
        return <LinkedinIcon className="w-4 h-4 text-white" />;
      case "tiktok":
        return <MusicIcon className="w-4 h-4 text-white" />;
      case "youtube":
        return <PlayIcon className="w-4 h-4 text-white" />;
      default:
        return null;
    }
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
        // Use dummy data if no posts exist, otherwise use real data
        setScheduledPosts(data.length > 0 ? data : dummyScheduledPosts);
      } else {
        // If API fails, use dummy data
        setScheduledPosts(dummyScheduledPosts);
      }
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      // Use dummy data on error
      setScheduledPosts(dummyScheduledPosts);
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
          };

      const response = await fetch("/api/schedule", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowScheduleModal(false);
        setEditingPost(null);
        setSelectedContent("");
        setScheduledDate("");
        setScheduledTime("");
        fetchScheduledPosts();
        showToast.success(
          editingPost ? "Post updated!" : "Post scheduled!",
          `Your ${selectedPlatform} post is scheduled for ${formatDateTime(scheduledDateTime.toISOString())}`
        );
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
  ]);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteConfirm({ open: true, id });
  }, []);

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
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>Schedule Posts</h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>We post for you automatically</p>
        </div>
        <Button
          onClick={() => {
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
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* View Tabs */}
      <div className={`rounded-xl p-1 border transition-colors duration-300 ${
        isDark ? "bg-slate-800 border-slate-700" : "bg-gray-100 border-gray-200"
      }`}>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              viewMode === "calendar"
                ? isDark
                  ? "bg-slate-700 text-white shadow-sm"
                  : "bg-white text-gray-900 shadow-sm"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Upcoming Posts</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              viewMode === "list"
                ? isDark
                  ? "bg-slate-700 text-white shadow-sm"
                  : "bg-white text-gray-900 shadow-sm"
                : isDark
                ? "text-slate-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">This Week Scheduled</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className={`border rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>Upcoming</p>
            <p className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}>{upcomingPosts.length}</p>
          </CardContent>
        </Card>
        <Card className={`border rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>Posted</p>
            <p className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}>{pastPosts.filter((p) => p.posted).length}</p>
          </CardContent>
        </Card>
        <Card className={`border rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <CardContent className="p-4 sm:p-6">
            <p className={`text-sm mb-2 font-medium ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>Total</p>
            <p className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}>{scheduledPosts.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2Icon className={`w-8 h-8 animate-spin mx-auto mb-4 ${
            isDark ? "text-purple-400" : "text-gray-700"
          }`} />
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>Loading scheduled posts...</p>
        </div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        upcomingPosts.length === 0 ? (
          <div className={`text-center py-12 border rounded-xl transition-colors duration-300 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CalendarIcon className={`w-12 h-12 mx-auto mb-3 ${
              isDark ? "text-slate-500" : "text-gray-400"
            }`} />
            <h3 className={`text-lg font-semibold mb-1.5 ${
              isDark ? "text-white" : "text-gray-900"
            }`}>No scheduled posts</h3>
            <p className={`text-sm mb-4 ${
              isDark ? "text-slate-400" : "text-gray-600"
            }`}>
              Schedule your first post to see it on the calendar
            </p>
            <Button
              onClick={() => setShowScheduleModal(true)}
              className={`rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                  : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
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
              <h2 className={`text-xl font-bold mb-6 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Upcoming</h2>
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <Card
                    key={post.id}
                    className={`border rounded-xl transition-all duration-200 ${
                      isDark
                        ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(post.platform)}
                            <span className={`text-sm font-semibold capitalize ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}>
                              {post.platform}
                            </span>
                          </div>
                          {(() => {
                            const status = getPlatformPostingStatus(post.platform);
                            return (
                              <span
                                className={`px-2 py-0.5 text-xs rounded-lg border transition-colors duration-300 ${
                                  status.type === "auto"
                                    ? isDark
                                      ? "bg-green-950/50 text-green-400 border-green-800"
                                      : "bg-green-50 text-green-700 border-green-200"
                                    : isDark
                                    ? "bg-orange-950/50 text-orange-400 border-orange-800"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
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
                            isDark
                              ? "bg-slate-700 text-slate-300 border-slate-600"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}>
                            {getTimeUntil(post.scheduledFor)}
                          </span>
                        </div>
                          <span className={`text-xs ${
                            isDark ? "text-slate-400" : "text-gray-600"
                          }`}>
                          {formatDateTime(post.scheduledFor)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleEdit(post)}
                          size="sm"
                          variant="outline"
                          className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                            isDark
                              ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
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
                            isDark
                              ? "border-slate-600 text-red-400 hover:bg-red-950/30 hover:border-red-500 hover:text-red-300"
                              : "border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300"
                          }`}
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                      <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                        isDark
                          ? "bg-slate-900/50 border-slate-700"
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        {post.platform === "youtube" ? (
                          <p className={`text-sm leading-relaxed ${
                            isDark ? "text-slate-200" : "text-gray-900"
                          }`}>
                            🎬 YouTube Video - {post.content || "Video scheduled"}
                          </p>
                        ) : (
                          <pre className={`whitespace-pre-wrap text-sm leading-relaxed line-clamp-2 ${
                            isDark ? "text-slate-200" : "text-gray-900"
                          }`}>
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
              <h2 className={`text-xl font-bold mb-6 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Past</h2>
              <div className="space-y-4">
                {pastPosts.map((post) => (
                  <Card
                    key={post.id}
                    className={`border rounded-xl opacity-80 transition-colors duration-300 ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                          <span className={`text-sm font-medium capitalize ${
                            isDark ? "text-slate-300" : "text-gray-700"
                          }`}>
                          {post.platform}
                        </span>
                        {post.posted && (
                            <span className={`px-2 py-0.5 text-xs rounded-lg border transition-colors duration-300 ${
                              isDark
                                ? "bg-green-950/50 text-green-400 border-green-800"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}>
                            Posted
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>
                        {formatDateTime(post.scheduledFor)}
                      </span>
                    </div>
                      {post.platform === "youtube" ? (
                        <p className={`text-xs leading-relaxed ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
                          🎬 YouTube Video - {post.content || "Video scheduled"}
                        </p>
                      ) : (
                        <pre className={`whitespace-pre-wrap text-xs leading-relaxed line-clamp-2 ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>
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
            <div className={`text-center py-12 border rounded-xl transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CalendarIcon className={`w-12 h-12 mx-auto mb-3 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <h3 className={`text-lg font-semibold mb-1.5 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>No scheduled posts</h3>
              <p className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                We post for you automatically
              </p>
              <Button
                onClick={() => setShowScheduleModal(true)}
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                    : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
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
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => {
            setShowScheduleModal(false);
            setEditingPost(null);
            // Reset YouTube state
            setYoutubeVideoTitle("");
            setYoutubeDescription("");
            setYoutubeContentType("rain_sounds");
            setYoutubeDuration(30);
            setYoutubeQuality("high");
            setYoutubePrivacy("public");
          }}
        >
          <div
            className={`border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl mx-4 transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between transition-colors duration-300 ${
              isDark ? "border-slate-700" : "border-gray-200"
            }`}>
              <h2 className={`text-base sm:text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {editingPost ? "Edit Post" : "Schedule Post"}
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                  // Reset YouTube state
                  setYoutubeVideoTitle("");
                  setYoutubeDescription("");
                  setYoutubeContentType("rain_sounds");
                  setYoutubeDuration(30);
                  setYoutubeQuality("high");
                  setYoutubePrivacy("public");
                }}
                className={`transition-all duration-200 p-1.5 rounded-xl ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-2 ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}>Platform</label>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPlatform(type)}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl border transition-all duration-200 ${
                        selectedPlatform === type
                          ? isDark
                            ? "border-purple-500 bg-purple-900/50 text-purple-300"
                            : "border-gray-900 bg-gray-50 text-gray-900"
                          : isDark
                          ? "border-slate-700 bg-slate-700/50 text-slate-400 hover:border-slate-600 hover:bg-slate-700 hover:text-slate-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {getPlatformIcon(type)}
                      <span className="text-xs capitalize hidden sm:inline">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube Connection Warning */}
              {selectedPlatform === "youtube" && !youtubeConnected && (
                <div className={`p-3 border rounded-xl transition-colors duration-300 ${
                  isDark
                    ? "bg-yellow-950/30 border-yellow-800"
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <p className={`text-sm ${
                    isDark ? "text-yellow-300" : "text-yellow-800"
                  }`}>
                    ⚠️ YouTube account not connected. Please connect your YouTube account in Settings first.
                  </p>
                </div>
              )}

              {/* YouTube Video Generation Form */}
              {selectedPlatform === "youtube" ? (
                <>
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}>Video Title *</label>
                    <input
                      type="text"
                      value={youtubeVideoTitle}
                      onChange={(e) => setYoutubeVideoTitle(e.target.value)}
                      placeholder="Enter video title..."
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        isDark
                          ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}>Description</label>
                    <textarea
                      value={youtubeDescription}
                      onChange={(e) => setYoutubeDescription(e.target.value)}
                      placeholder="Enter video description (optional)..."
                      className={`w-full px-4 py-3 border rounded-xl resize-none text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        isDark
                          ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"
                      }`}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>Content Type</label>
                      <select
                        value={youtubeContentType}
                        onChange={(e) => setYoutubeContentType(e.target.value as "rain_sounds" | "sleep_sounds" | "ambient_sounds" | "white_noise")}
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                        }`}
                      >
                        <option value="rain_sounds">Rain Sounds</option>
                        <option value="sleep_sounds">Sleep Sounds</option>
                        <option value="ambient_sounds">Ambient Sounds</option>
                        <option value="white_noise">White Noise</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>Duration (minutes)</label>
                      <input
                        type="number"
                        value={youtubeDuration}
                        onChange={(e) => setYoutubeDuration(parseInt(e.target.value) || 30)}
                        min={1}
                        max={480}
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>Quality</label>
                      <select
                        value={youtubeQuality}
                        onChange={(e) => setYoutubeQuality(e.target.value as "high" | "medium" | "low")}
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                        }`}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}>Privacy</label>
                      <select
                        value={youtubePrivacy}
                        onChange={(e) => setYoutubePrivacy(e.target.value as "public" | "unlisted" | "private")}
                        className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                            : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                        }`}
                      >
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* Regular Text Content Form */
                <>
              <div>
                    <label className={`block text-xs font-semibold mb-2 ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}>Content</label>
                <textarea
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                      className={`w-full px-4 py-3 border rounded-xl resize-none text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        isDark
                          ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400"
                      }`}
                  rows={6}
                />
                    <div className={`mt-1.5 text-xs text-right ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                  {selectedContent.length} chars
                </div>
              </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-slate-300" : "text-gray-700"
                  }`}>Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={getTodayDate()}
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                        : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${
                    isDark ? "text-slate-300" : "text-gray-700"
                  }`}>
                    Time
                    {selectedPlatform === "youtube" && scheduledDate === getTodayDate() && (
                      <span className={`font-normal ml-1 ${
                        isDark ? "text-slate-400" : "text-gray-500"
                      }`}>(min 40 min from now)</span>
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
                    className={`w-full px-3 py-2 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white hover:border-slate-500"
                        : "bg-white border-gray-300 text-gray-900 hover:border-gray-400"
                    }`}
                  />
                  {selectedPlatform === "youtube" && scheduledDate === getTodayDate() && (
                    <p className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}>
                      YouTube requires scheduled videos to be at least 15 minutes in the future. We require 40+ minutes to account for video generation time (15-20 min), timezone differences, and processing delays.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Display */}
            {progress && currentJobId && (
              <div className={`px-4 sm:px-6 pb-4 border-t transition-colors duration-300 ${
                isDark
                  ? "border-slate-700 bg-purple-950/30"
                  : "border-gray-200 bg-purple-50/50"
              }`}>
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2Icon className={`w-4 h-4 animate-spin ${
                        isDark ? "text-purple-400" : "text-purple-600"
                      }`} />
                      <span className={`text-sm font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {progress.status === "generating" ? "Generating Video..." : 
                         progress.status === "uploading" ? "Uploading to YouTube..." :
                         progress.status === "completed" ? "Completed!" :
                         "Processing..."}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}>
                      {progress.percentage}%
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className={`flex items-center justify-between text-xs ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>
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
                        className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl transition-all duration-200"
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 transition-colors duration-300 ${
              isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"
            }`}>
              <Button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                  // Reset YouTube state
                  setYoutubeVideoTitle("");
                  setYoutubeDescription("");
                  setYoutubeContentType("rain_sounds");
                  setYoutubeDuration(30);
                  setYoutubeQuality("high");
                  setYoutubePrivacy("public");
                }}
                size="sm"
                variant="outline"
                className={`w-full sm:w-auto rounded-xl transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={
                  isSubmitting || 
                  !scheduledDate || 
                  !scheduledTime ||
                  (selectedPlatform === "youtube" 
                    ? (!youtubeVideoTitle.trim() || !youtubeConnected)
                    : !selectedContent.trim())
                }
                size="sm"
                className={`w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-xl transition-all duration-200 ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                    : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
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
          </div>
        </div>
      )}

      {/* Post Reminder Modal */}
      <PostReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderPost(null);
        }}
        post={reminderPost ? {
          id: reminderPost.id,
          platform: reminderPost.platform,
          content: reminderPost.content,
          scheduledFor: reminderPost.scheduledFor,
        } : null}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[100]">
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
        </div>
      )}

      <KeyboardShortcuts />
    </div>
  );
}
