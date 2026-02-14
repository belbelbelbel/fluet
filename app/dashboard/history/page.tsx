"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  CalendarPlusIcon,
  RefreshCwIcon,
} from "lucide-react";

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

export default function DashboardHistoryPage() {
  const { userId } = useAuth();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewingContent, setViewingContent] = useState<GeneratedContent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  const fetchContent = useCallback(async () => {
    if (!userId) {
      setContent([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const url = `/api/content?filter=${filter}${userId ? `&userId=${userId}` : ''}`;
      
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[History Page] Failed to fetch content:", response.status, errorData);
        
        // If 401, it means authentication failed - user needs to sign in
        if (response.status === 401) {
          console.error("[History Page] Authentication failed - user is not signed in");
          showToast.error("Authentication required", "Please sign in to view your content history");
          setContent([]);
          return;
        }
        
        // For other errors, just set empty content
        setContent([]);
        return;
      }
      
      const data = await response.json();
      const contentArray = Array.isArray(data) ? data : [];
      setContent(contentArray);
    } catch (error) {
      console.error("[History Page] Error fetching content:", error);
      setContent([]);
      showToast.error("Error", "Failed to load content history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter, userId]);

  useEffect(() => {
    // Only fetch if user is loaded, signed in, and has a userId
    if (isLoaded) {
      if (isSignedIn && userId) {
        fetchContent();
      } else {
        setContent([]);
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, userId, fetchContent]);

  const handleCopy = useCallback(async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast.success("Copied to clipboard!", "Content is ready to paste");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteConfirm({ open: true, id });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.id) return;
    
    if (!userId) {
      showToast.error("Authentication required", "Please sign in to delete content");
      setDeleteConfirm({ open: false, id: null });
      return;
    }

    const id = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });

    try {
      const response = await fetch(`/api/content/${id}?userId=${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setContent((prev) => prev.filter((item) => item.id !== id));
        showToast.success("Content deleted", "The content has been removed from your history");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Failed to delete content";
        console.error("Delete failed:", response.status, errorData);
        showToast.error("Failed to delete", errorMessage);
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      showToast.error("Failed to delete", "An error occurred while deleting the content");
    }
  }, [deleteConfirm.id, userId]);

  const handleSchedule = useCallback((item: GeneratedContent) => {
    router.push(`/dashboard/schedule?content=${encodeURIComponent(item.content)}&platform=${item.contentType}`);
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

  return (
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>Content History</h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>Your generated content</p>
        </div>
        <Button
          onClick={fetchContent}
          size="sm"
          variant="outline"
          className={`rounded-xl transition-all duration-200 ${
            isDark
              ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
              : "border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
          title="Refresh"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === "all"
                ? "bg-purple-600 text-white"
                : isDark
                ? "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {contentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                filter === type
                  ? "bg-purple-600 text-white"
                  : isDark
                  ? "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
            <Card key={i} className={`border rounded-xl animate-pulse transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${
                    isDark ? "bg-slate-700" : "bg-gray-200"
                  }`}></div>
                  <div className="flex-1">
                    <div className={`h-4 rounded w-1/4 mb-2 ${
                      isDark ? "bg-slate-700" : "bg-gray-200"
                    }`}></div>
                    <div className={`h-3 rounded w-1/2 ${
                      isDark ? "bg-slate-700" : "bg-gray-200"
                    }`}></div>
                  </div>
                </div>
                <div className={`h-16 rounded mb-2 ${
                  isDark ? "bg-slate-700" : "bg-gray-200"
                }`}></div>
                <div className={`h-24 rounded ${
                  isDark ? "bg-slate-700" : "bg-gray-200"
                }`}></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className={`text-center py-12 border rounded-xl transition-colors duration-300 ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          <FileTextIcon className={`w-12 h-12 mx-auto mb-3 ${
            isDark ? "text-slate-500" : "text-gray-400"
          }`} />
          <h3 className={`text-lg font-semibold mb-1.5 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>No content history yet</h3>
          <p className={`text-sm mb-4 ${
            isDark ? "text-slate-400" : "text-gray-600"
          }`}>
            {userId 
              ? "Generate your first piece of content to see it here"
              : "Please sign in to view your content history"}
          </p>
          {userId && (
            <Button
              onClick={() => router.push("/dashboard/generate")}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Generate Content
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {content.map((item) => (
            <Card
              key={item.id}
              className={`border rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${
                      isDark ? "bg-slate-700" : "bg-gray-100"
                    }`}>
                      {getContentTypeIcon(item.contentType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-semibold capitalize text-sm sm:text-base ${
                          isDark ? "text-white" : "text-gray-950"
                        }`}>
                          {item.contentType}
                        </span>
                        {item.posted === true && (
                          <span className={`px-2 py-1 text-xs rounded-full border transition-colors duration-300 ${
                            isDark
                              ? "bg-green-950/50 text-green-400 border-green-800"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            ✓ Posted
                          </span>
                        )}
                      </div>
                      <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        {item.tone && (
                          <>
                            <span>•</span>
                            <span className={`capitalize px-2 py-0.5 rounded-lg ${
                              isDark
                                ? "bg-slate-700 text-slate-300"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {item.tone}
                            </span>
                          </>
                        )}
                        {item.style && (
                          <>
                            <span>•</span>
                            <span className={`capitalize px-2 py-0.5 rounded-lg ${
                              isDark
                                ? "bg-slate-700 text-slate-300"
                                : "bg-gray-100 text-gray-700"
                            }`}>
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
                      variant="outline"
                      className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
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
                      variant="outline"
                      className={`rounded-xl transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(item.id)}
                      size="sm"
                      variant="outline"
                      className={`rounded-xl transition-all duration-200 ${
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
              <div className="mb-4">
                <p className={`text-xs mb-1.5 font-medium ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>Prompt</p>
                <p className={`text-sm px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  isDark
                    ? "text-slate-200 bg-slate-900/50 border-slate-700"
                    : "text-gray-700 bg-gray-50 border-gray-200"
                }`}>{item.prompt}</p>
              </div>
              <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-slate-900/50 border-slate-700"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>Content</p>
                  <span className={`text-xs ${
                    isDark ? "text-slate-500" : "text-gray-500"
                  }`}>{item.content.length} chars</span>
                </div>
                <pre className={`whitespace-pre-wrap text-sm leading-relaxed max-h-40 overflow-y-auto ${
                  isDark ? "text-slate-200" : "text-gray-950"
                }`}>
                  {item.content}
                </pre>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Content Modal */}
      {viewingContent && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setViewingContent(null)}
        >
          <div 
            className={`rounded-xl border max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors duration-300 ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b flex items-center justify-between transition-colors duration-300 ${
              isDark ? "border-slate-700" : "border-gray-200"
            }`}>
              <h3 className={`text-lg font-semibold capitalize ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                {viewingContent.contentType}
              </h3>
              <button
                onClick={() => setViewingContent(null)}
                className={`transition-all duration-200 p-1.5 rounded-xl ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-700"
                    : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
                }`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <p className={`text-xs mb-1.5 font-medium ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}>Prompt</p>
                <p className={`text-sm px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  isDark
                    ? "text-slate-200 bg-slate-900/50 border-slate-700"
                    : "text-gray-700 bg-gray-50 border-gray-200"
                }`}>
                  {viewingContent.prompt}
                </p>
              </div>
              {viewingContent.tone && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={isDark ? "text-slate-400" : "text-gray-600"}>Tone:</span>
                  <span className={`px-2 py-0.5 rounded-lg capitalize ${
                    isDark
                      ? "bg-slate-700 text-slate-300"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {viewingContent.tone}
                  </span>
                  {viewingContent.style && (
                    <>
                      <span className={isDark ? "text-slate-400" : "text-gray-600"}>Style:</span>
                      <span className={`px-2 py-0.5 rounded-lg capitalize ${
                        isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {viewingContent.style}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>Content</p>
                  <span className={`text-xs ${
                    isDark ? "text-slate-400" : "text-gray-600"
                  }`}>{viewingContent.content.length} chars</span>
                </div>
                <div className={`rounded-xl p-4 border transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-900/50 border-slate-700"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${
                    isDark ? "text-slate-200" : "text-gray-950"
                  }`}>
                    {viewingContent.content}
                  </pre>
                </div>
              </div>
            </div>

            <div className={`p-4 border-t flex items-center justify-end gap-2 transition-colors duration-300 ${
              isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"
            }`}>
              <Button
                onClick={() => {
                  handleCopy(viewingContent.content, viewingContent.id);
                }}
                size="sm"
                variant="outline"
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
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
                className={`transition-all duration-200 ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                }`}
              >
                <CalendarPlusIcon className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button
                onClick={() => setViewingContent(null)}
                size="sm"
                variant="ghost"
                className={`transition-all duration-200 ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-700"
                    : "text-gray-400 hover:text-gray-950 hover:bg-gray-200"
                }`}
              >
                Close
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
            title="Delete Content"
            description="Are you sure you want to delete this content? This action cannot be undone."
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
