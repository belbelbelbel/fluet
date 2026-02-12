"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  CalendarIcon,
  FileTextIcon,
  XIcon,
  RefreshCwIcon,
  Loader2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";

interface GeneratedContent {
  id: number;
  content: string;
  prompt: string;
  contentType: string;
  tone?: string | null;
  style?: string | null;
  length?: string | null;
  posted?: boolean | null;
  createdAt: string;
}

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewingContent, setViewingContent] = useState<GeneratedContent | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      // Include userId in query params as fallback
      const url = userId 
        ? `/api/content?filter=${filter}&userId=${userId}`
        : `/api/content?filter=${filter}`;
      
      const response = await fetch(url, {
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch content:", response.status, errorData);
        setContent([]); // Set empty array on error
        return;
      }
      
      const data = await response.json();
      console.log("Fetched content:", data.length, "items");
      const contentArray = Array.isArray(data) ? data : [];
      setContent(contentArray);
      if (contentArray.length > 0) {
        showToast.success(`Loaded ${contentArray.length} content items`, "Your content history is ready");
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setContent([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [filter, userId]);

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchContent();
    }
  }, [isSignedIn, userId, fetchContent]);

  const handleCopy = useCallback(async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast.success("Copied to clipboard!", "Content is ready to paste");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    
    if (!userId) {
      showToast.error("Authentication required", "Please sign in to delete content");
      return;
    }
    
    try {
      const url = `/api/content/${id}?userId=${userId}`;
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setContent((prev) => prev.filter((item) => item.id !== id));
        showToast.success("Content deleted", "The content has been removed from your history");
      } else {
        showToast.error("Failed to delete", "Please try again");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      showToast.error("Failed to delete", "An error occurred while deleting the content");
    }
  }, [userId]);

  const handleSchedule = useCallback((item: GeneratedContent) => {
    router.push(`/schedule?content=${encodeURIComponent(item.content)}&platform=${item.contentType}`);
  }, [router]);

  const getContentTypeIcon = useCallback((type: string) => {
    switch (type) {
      case "twitter":
        return <TwitterIcon className="w-4 h-4 text-blue-400" />;
      case "instagram":
        return <InstagramIcon className="w-4 h-4 text-pink-400" />;
      case "linkedin":
        return <LinkedinIcon className="w-4 h-4 text-blue-600" />;
      case "tiktok":
        return <MusicIcon className="w-4 h-4 text-cyan-400" />;
      default:
        return null;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const contentTypes = useMemo(() => (["twitter", "instagram", "linkedin", "tiktok"] as ContentType[]), []);

  // Show loading spinner while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Loader2Icon className="w-16 h-16 text-blue-500 animate-spin" />
            <FileTextIcon className="w-8 h-8 text-purple-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="text-gray-400">You need to be signed in to view your content history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header - Consistent */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1.5">
                  History
                </h1>
                <p className="text-sm text-gray-500">
                  Your generated content
                </p>
              </div>
              <Button
                onClick={fetchContent}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                title="Refresh"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters - Consistent */}
          <div className="mb-8">
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                }`}
              >
                All
              </button>
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 ${
                    filter === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  {getContentTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-800 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-800 rounded mb-2"></div>
                  <div className="h-24 bg-gray-800 rounded"></div>
                </div>
              ))}
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12">
              <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-1.5">No content yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Generate your first piece of content to get started
              </p>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href="/generate">Generate Content</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        {getContentTypeIcon(item.contentType)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold capitalize text-sm sm:text-base text-white">
                            {item.contentType}
                          </span>
                          {item.posted === true && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              ✓ Posted
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          {item.tone && (
                            <>
                              <span>•</span>
                              <span className="capitalize px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                {item.tone}
                              </span>
                            </>
                          )}
                          {item.style && (
                            <>
                              <span>•</span>
                              <span className="capitalize px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                                {item.style}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleCopy(item.content, item.id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                        title="Copy"
                      >
                        {copiedId === item.id ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          <CopyIcon className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => setViewingContent(item)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5">Prompt</p>
                    <p className="text-gray-300 text-sm bg-gray-900/30 px-3 py-2 rounded border border-gray-800">{item.prompt}</p>
                  </div>
                  <div className="p-3 bg-gray-900/30 rounded border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Content</p>
                      <span className="text-xs text-gray-600">{item.content.length} chars</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed max-h-40 overflow-y-auto">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Content Modal */}
      {viewingContent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewingContent(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Minimal */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white capitalize">
                {viewingContent.contentType}
              </h3>
              <button
                onClick={() => setViewingContent(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-800 rounded"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Clean */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Prompt</p>
                <p className="text-gray-300 text-sm bg-gray-900/30 px-3 py-2 rounded border border-gray-800">
                  {viewingContent.prompt}
                </p>
              </div>
              {viewingContent.tone && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Tone:</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded capitalize">
                    {viewingContent.tone}
                  </span>
                  {viewingContent.style && (
                    <>
                      <span className="text-gray-500">Style:</span>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded capitalize">
                        {viewingContent.style}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-500">Content</p>
                  <span className="text-xs text-gray-600">{viewingContent.content.length} chars</span>
                </div>
                <div className="bg-gray-900/30 rounded p-4 border border-gray-800">
                  <pre className="whitespace-pre-wrap text-gray-100 text-sm leading-relaxed">
                    {viewingContent.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer - Simplified */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  handleCopy(viewingContent.content, viewingContent.id);
                }}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                {copiedId === viewingContent.id ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={() => {
                  setViewingContent(null);
                  handleSchedule(viewingContent);
                }}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Schedule
              </Button>
              <Button
                onClick={() => setViewingContent(null)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <KeyboardShortcuts />
    </div>
  );
}

