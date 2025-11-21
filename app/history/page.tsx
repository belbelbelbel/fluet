"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";

interface GeneratedContent {
  id: number;
  content: string;
  prompt: string;
  contentType: string;
  tone?: string;
  style?: string;
  length?: string;
  posted: boolean;
  createdAt: string;
}

export default function HistoryPage() {
  const { isSignedIn } = useUser();
  const { userId } = useAuth();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchContent();
    }
  }, [isSignedIn, userId, fetchContent]);

  const handleCopy = useCallback(async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
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
      }
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  }, []);

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
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Content History
            </h1>
            <p className="text-sm sm:text-base text-gray-400">View and manage your generated content</p>
          </div>

          {/* Filters */}
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

          {/* Content List */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : content.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No content found</p>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700"
              >
                <a href="/generate">Generate Your First Content</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center space-x-3">
                      {getContentTypeIcon(item.contentType)}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold capitalize text-sm sm:text-base">
                            {item.contentType}
                          </span>
                          {item.posted && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              Posted
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
                              <span className="capitalize">{item.tone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleCopy(item.content, item.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
                    <p className="text-sm text-gray-400 mb-1">Prompt:</p>
                    <p className="text-gray-300 text-sm">{item.prompt}</p>
                  </div>

                  <div className="p-4 bg-gray-900 rounded border border-gray-700">
                    <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

