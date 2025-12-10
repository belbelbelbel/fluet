"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
        return <TwitterIcon className="w-5 h-5 text-blue-400" />;
      case "instagram":
        return <InstagramIcon className="w-5 h-5 text-pink-400" />;
      case "linkedin":
        return <LinkedinIcon className="w-5 h-5 text-blue-600" />;
      case "tiktok":
        return <MusicIcon className="w-5 h-5 text-cyan-400" />;
      default:
        return null;
    }
  };

  const fetchScheduledPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/schedule");
      if (response.ok) {
        const data = await response.json();
        setScheduledPosts(data);
      }
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
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
          }
        : {
            content: selectedContent,
            platform: selectedPlatform,
            scheduledFor: scheduledDateTime.toISOString(),
          };

      const response = await fetch("/api/schedule", {
        method,
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
  }, [selectedContent, selectedPlatform, scheduledDate, scheduledTime, editingPost, fetchScheduledPosts, formatDateTime]);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteConfirm({ open: true, id });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.id) return;

    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });

    try {
      const response = await fetch(`/api/schedule?id=${id}`, {
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
  }, [deleteConfirm.id, fetchScheduledPosts]);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Schedule Posts</h1>
          <p className="text-gray-400">Automate your content posting</p>
        </div>
        <Button
          onClick={() => {
            setEditingPost(null);
            setSelectedContent("");
            setScheduledDate("");
            setScheduledTime("");
            setShowScheduleModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Upcoming</p>
          <p className="text-2xl font-semibold text-white">{upcomingPosts.length}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Posted</p>
          <p className="text-2xl font-semibold text-white">{pastPosts.filter((p) => p.posted).length}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-semibold text-white">{scheduledPosts.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2Icon className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading scheduled posts...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Posts */}
          {upcomingPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getPlatformIcon(post.platform)}
                          <span className="text-sm font-medium text-white capitalize">
                            {post.platform}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {getTimeUntil(post.scheduledFor)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(post.scheduledFor)}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => handleEdit(post)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(post.id)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-800 h-8 w-8 p-0"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-900/30 rounded p-3 border border-gray-800">
                      <pre className="whitespace-pre-wrap text-gray-200 text-xs leading-relaxed line-clamp-2">
                        {post.content}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Posts */}
          {pastPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Past</h2>
              <div className="space-y-4">
                {pastPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-900/30 border border-gray-800 rounded-lg p-3 opacity-70"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-sm font-medium text-gray-400 capitalize">
                          {post.platform}
                        </span>
                        {post.posted && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            Posted
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatDateTime(post.scheduledFor)}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-400 text-xs leading-relaxed line-clamp-2">
                      {post.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheduledPosts.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-1.5">No scheduled posts</h3>
              <p className="text-sm text-gray-500 mb-4">
                Schedule your content to automate posting
              </p>
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setShowScheduleModal(false);
            setEditingPost(null);
          }}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingPost ? "Edit Post" : "Schedule Post"}
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                }}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-800 rounded"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Platform</label>
                <div className="flex gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPlatform(type)}
                      className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        selectedPlatform === type
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                      }`}
                    >
                      {getPlatformIcon(type)}
                      <span className="text-xs capitalize hidden sm:inline">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Content</label>
                <textarea
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  placeholder="Paste or type your content here..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  rows={6}
                />
                <div className="mt-1.5 text-xs text-gray-600 text-right">
                  {selectedContent.length} chars
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                }}
                size="sm"
                variant="ghost"
                className="text-black hover:text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={isSubmitting || !selectedContent.trim() || !scheduledDate || !scheduledTime}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4"
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
