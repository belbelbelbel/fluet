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
  FilterIcon,
  CalendarIcon,
  FileTextIcon,
  EyeIcon,
  XIcon,
  CalendarPlusIcon,
  RefreshCwIcon,
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
  const { isSignedIn } = useUser();
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
    
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "DELETE",
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
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b pt-20 from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Content History
              </h1>
              <p className="text-sm sm:text-base text-gray-400">View and manage your generated content</p>
            </div>
            <Button
              onClick={() => {
                console.log("Refreshing content...");
                fetchContent();
              }}
              variant="outline"
              size="sm"
              className="border-gray-600 text-black hover:bg-gray-700"
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400 sm:hidden">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center space-x-2 ${
                    filter === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {getContentTypeIcon(type)}
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-32 bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : !isSignedIn ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <FileTextIcon className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Please sign in</h3>
              <p className="text-gray-400">You need to be signed in to view your content history.</p>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <FileTextIcon className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Content Yet</h3>
              <p className="text-gray-400 mb-2 max-w-md mx-auto">
                Your generated content will appear here for easy access and management
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                Generate your first piece of content to get started
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg"
              >
                <a href="/generate">Generate Your First Content</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all shadow-lg"
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
                        onClick={() => setViewingContent(item)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleCopy(item.content, item.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                      >
                        {copiedId === item.id ? (
                          <>
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <CopyIcon className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSchedule(item)}
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
                      >
                        <CalendarPlusIcon className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Original Prompt</p>
                    <p className="text-gray-300 text-sm bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700">{item.prompt}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Generated Content</p>
                      <span className="text-xs text-gray-500">{item.content.length} characters</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed max-h-48 overflow-y-auto">
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
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  {getContentTypeIcon(viewingContent.contentType)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">
                    {viewingContent.contentType} Content
                  </h3>
                  <p className="text-sm text-gray-400">{formatDate(viewingContent.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingContent(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Original Prompt</p>
                <p className="text-gray-300 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700">
                  {viewingContent.prompt}
                </p>
              </div>
              {viewingContent.tone && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-400">Tone:</span>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded capitalize">
                    {viewingContent.tone}
                  </span>
                  {viewingContent.style && (
                    <>
                      <span className="text-gray-400">Style:</span>
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded capitalize">
                        {viewingContent.style}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Generated Content</p>
                  <span className="text-xs text-gray-500">{viewingContent.content.length} characters</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
                    {viewingContent.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Ready to schedule this content?
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => {
                    handleCopy(viewingContent.content, viewingContent.id);
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 sm:flex-none"
                >
                  {copiedId === viewingContent.id ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setViewingContent(null);
                    handleSchedule(viewingContent);
                  }}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600/20 flex-1 sm:flex-none"
                >
                  <CalendarPlusIcon className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button
                  onClick={() => setViewingContent(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                >
                  Close
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

