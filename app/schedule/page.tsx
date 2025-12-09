"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import Link from "next/link";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  ZapIcon,
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

export default function SchedulePage() {
  const { isSignedIn } = useUser();
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

  const contentTypes: ContentType[] = ["twitter", "instagram", "linkedin", "tiktok"];

  // Check for pre-filled content from URL params
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
        // Clean up URL
        window.history.replaceState({}, "", "/schedule");
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
    if (isSignedIn && userId) {
      fetchScheduledPosts();
    }
  }, [isSignedIn, userId, fetchScheduledPosts]); // eslint-disable-line react-hooks/exhaustive-deps

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

      const url = editingPost ? "/api/schedule" : "/api/schedule";
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

      const response = await fetch(url, {
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

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;

    try {
      const response = await fetch(`/api/schedule?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchScheduledPosts();
        showToast.success("Post deleted", "The scheduled post has been removed");
      } else {
        showToast.error("Failed to delete", "Please try again");
      }
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      showToast.error("Failed to delete", "An error occurred. Please try again.");
    }
  }, [fetchScheduledPosts]);

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

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="text-gray-400">You need to be signed in to schedule posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b pt-20 from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                  Schedule & Automate
                </h1>
                <p className="text-gray-400 text-base sm:text-lg">
                  Automate your social media content posting
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingPost(null);
                  setSelectedContent("");
                  setScheduledDate("");
                  setScheduledTime("");
                  setShowScheduleModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Schedule Post
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-white">{upcomingPosts.length}</p>
                </div>
                <ClockIcon className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Posted</p>
                  <p className="text-3xl font-bold text-white">{pastPosts.filter((p) => p.posted).length}</p>
                </div>
                <CheckIcon className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total</p>
                  <p className="text-3xl font-bold text-white">{scheduledPosts.length}</p>
                </div>
                <ZapIcon className="w-10 h-10 text-purple-400" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading scheduled posts...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Posts */}
              {upcomingPosts.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <ClockIcon className="w-6 h-6 mr-2 text-blue-400" />
                    Upcoming Posts
                  </h2>
                  <div className="space-y-4">
                    {upcomingPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg"
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-gray-700 rounded-lg">
                                {getPlatformIcon(post.platform)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-white capitalize">
                                    {post.platform}
                                  </span>
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                    {getTimeUntil(post.scheduledFor)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                  {formatDateTime(post.scheduledFor)}
                                </p>
                              </div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 mt-3">
                              <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed line-clamp-3">
                                {post.content}
                              </pre>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(post)}
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                            >
                              <EditIcon className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(post.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Posts */}
              {pastPosts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <CheckIcon className="w-6 h-6 mr-2 text-green-400" />
                    Past Posts
                  </h2>
                  <div className="space-y-4">
                    {pastPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 opacity-75"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gray-700 rounded-lg">
                            {getPlatformIcon(post.platform)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white capitalize">
                                {post.platform}
                              </span>
                              {post.posted && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                  Posted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {formatDateTime(post.scheduledFor)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed line-clamp-2">
                            {post.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scheduledPosts.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <CalendarIcon className="w-16 h-16 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No Scheduled Posts Yet</h3>
                  <p className="text-gray-400 mb-2 max-w-md mx-auto">
                    Automate your social media by scheduling your content in advance
                  </p>
                  <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                    Schedule posts to go live at the perfect time for maximum engagement
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Schedule Your First Post
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-full"
                    >
                      <a href="/generate">Generate Content First</a>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => {
            setShowScheduleModal(false);
            setEditingPost(null);
          }}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingPost ? "Edit Scheduled Post" : "Schedule New Post"}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingPost ? "Update your scheduled post details" : "Set when your content should be posted"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingPost(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Platform
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedPlatform(type)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPlatform === type
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {getPlatformIcon(type)}
                        <span className="text-xs mt-2 capitalize">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Post Content
                </label>
                <textarea
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  placeholder="Paste or type your content here. You can also generate content first and then schedule it..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={10}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {selectedContent.length} characters
                  </p>
                  {!selectedContent && (
                    <Link
                      href="/generate"
                      className="text-xs text-black hover:text-blue-300 flex items-center"
                    >
                      Generate content first →
                    </Link>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-2" />
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select when to post</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <ClockIcon className="w-4 h-4 inline mr-2" />
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select the exact time</p>
                </div>
              </div>
              
              {/* Quick Time Suggestions */}
              {scheduledDate && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-400 mb-2">💡 Quick Schedule Tips</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Best times: 9 AM, 12 PM, 3 PM, 6 PM (your timezone)</li>
                    <li>• Weekdays typically get more engagement</li>
                    <li>• Schedule multiple posts for consistent presence</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                {selectedContent.trim() && scheduledDate && scheduledTime ? (
                  <span className="text-green-400">✓ Ready to schedule</span>
                ) : (
                  <span>Please fill in all fields to continue</span>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingPost(null);
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedule}
                  disabled={isSubmitting || !selectedContent.trim() || !scheduledDate || !scheduledTime}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editingPost ? "Updating..." : "Scheduling..."}
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {editingPost ? "Update" : "Schedule"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <KeyboardShortcuts />
    </div>
  );
}

