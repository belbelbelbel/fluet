"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarView } from "@/components/CalendarView";
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
  ChevronDownIcon,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";

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

  const contentTypes: ContentType[] = ["twitter", "instagram", "linkedin", "tiktok"];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const content = params.get("content");
      const platform = params.get("platform");
      if (content) {
        setSelectedContent(decodeURIComponent(content));
        if (platform && contentTypes.includes(platform as ContentType)) {
          setSelectedPlatform(platform as ContentType);
        }
        setShowScheduleModal(true);
        window.history.replaceState({}, "", "/dashboard/schedule");
      }
    }
  }, []);

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
      default:
        return null;
    }
  };

  const fetchScheduledPosts = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/schedule${userId ? `?userId=${userId}` : ''}`;
      console.log("[Schedule Page] Fetching scheduled posts from:", url);
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
            userId: userId, // Include userId in request body
          }
        : {
            content: selectedContent,
            platform: selectedPlatform,
            scheduledFor: scheduledDateTime.toISOString(),
            userId: userId, // Include userId in request body
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
  }, [selectedContent, selectedPlatform, scheduledDate, scheduledTime, editingPost, fetchScheduledPosts, formatDateTime, userId]);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteConfirm({ open: true, id });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });

    try {
      const url = `/api/schedule?id=${id}${userId ? `&userId=${userId}` : ''}`;
      console.log("[Schedule Page] Deleting scheduled post:", url);
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


  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return "bg-gray-50 border-gray-200 text-gray-950";
      case "instagram":
        return "bg-pink-50 border-pink-200 text-pink-900";
      case "linkedin":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "tiktok":
        return "bg-gray-50 border-gray-200 text-gray-950";
      default:
        return "bg-gray-50 border-gray-200 text-gray-950";
    }
  };

  const getPlatformIconBg = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return "bg-black";
      case "instagram":
        return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500";
      case "linkedin":
        return "bg-blue-600";
      case "tiktok":
        return "bg-black";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-2">Schedule Posts</h1>
          <p className="text-base text-gray-600">We post for you automatically</p>
        </div>
        <Button
          onClick={() => {
            setEditingPost(null);
            setSelectedContent("");
            setScheduledDate("");
            setScheduledTime("");
            setShowScheduleModal(true);
          }}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* View Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 border border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              viewMode === "calendar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Upcoming Posts</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">This Week Scheduled</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2 font-medium">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900">{upcomingPosts.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2 font-medium">Posted</p>
            <p className="text-2xl font-bold text-gray-900">{pastPosts.filter((p) => p.posted).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">{scheduledPosts.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2Icon className="w-8 h-8 text-gray-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scheduled posts...</p>
        </div>
      ) : viewMode === "calendar" ? (
        /* Calendar View */
        upcomingPosts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5">No scheduled posts</h3>
            <p className="text-sm text-gray-600 mb-4">
              Schedule your first post to see it on the calendar
            </p>
            <Button
              onClick={() => setShowScheduleModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming</h2>
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="bg-white border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getPlatformIcon(post.platform)}
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                            {post.platform}
                          </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200">
                            {getTimeUntil(post.scheduledFor)}
                          </span>
                        </div>
                          <span className="text-xs text-gray-600">
                          {formatDateTime(post.scheduledFor)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleEdit(post)}
                          size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8 w-8 p-0 rounded-xl"
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(post.id)}
                          size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-8 w-8 p-0 rounded-xl"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <pre className="whitespace-pre-wrap text-gray-900 text-sm leading-relaxed line-clamp-2">
                        {post.content}
                      </pre>
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Past</h2>
              <div className="space-y-4">
                {pastPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="bg-gray-50 border-gray-200 rounded-xl opacity-80"
                  >
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                          <span className="text-sm font-medium text-gray-700 capitalize">
                          {post.platform}
                        </span>
                        {post.posted && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                            Posted
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatDateTime(post.scheduledFor)}
                      </span>
                    </div>
                      <pre className="whitespace-pre-wrap text-gray-700 text-xs leading-relaxed line-clamp-2">
                      {post.content}
                    </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {scheduledPosts.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1.5">No scheduled posts</h3>
              <p className="text-sm text-gray-600 mb-4">
                We post for you automatically
              </p>
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
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
          }}
        >
          <div
            className="bg-white border border-gray-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingPost ? "Edit Post" : "Schedule Post"}
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-xl"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Platform</label>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPlatform(type)}
                      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl border transition-colors ${
                        selectedPlatform === type
                          ? "border-gray-900 bg-gray-50 text-gray-900"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {getPlatformIcon(type)}
                      <span className="text-xs capitalize hidden sm:inline">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Content</label>
                <textarea
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none text-sm"
                  rows={6}
                />
                <div className="mt-1.5 text-xs text-gray-500 text-right">
                  {selectedContent.length} chars
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                }}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={isSubmitting || !selectedContent.trim() || !scheduledDate || !scheduledTime}
                size="sm"
                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {editingPost ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  editingPost ? "Update" : "Schedule"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
