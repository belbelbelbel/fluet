"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Trash2,
  Plus,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Film,
  Clock,
} from "lucide-react";
import { showToast } from "@/lib/toast";

// Unused - commented out
// const formatLabels: Record<Format, { label: string; icon: LucideIcon }> = {
//   text_only: { label: "Text Only", icon: FileText },
//   text_image: { label: "Text + Image", icon: ImageIcon },
//   carousel: { label: "Carousel", icon: BookOpen },
//   video: { label: "Video", icon: Film },
// };

interface StackItem {
  ideaId: string;
  topic: string;
  caption?: string;
  hookExample?: string;
  tone?: string;
  format: string;
  savedAt: string;
}

export default function PostStackPage() {
  const router = useRouter();
  const [stack, setStack] = useState<StackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStack();
  }, []);

  const loadStack = () => {
    try {
      const saved = localStorage.getItem("postStack");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sort by most recent first
        const sorted = parsed.sort(
          (a: StackItem, b: StackItem) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setStack(sorted);
      }
    } catch (error) {
      console.error("Error loading stack:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    const newStack = stack.filter((_, i) => i !== index);
    setStack(newStack);
    localStorage.setItem("postStack", JSON.stringify(newStack));
    showToast.success("Removed", "Post removed from stack");
  };

  const handleEdit = (item: StackItem) => {
    // Navigate to caption generator with idea ID
    router.push(`/dashboard/generate-caption?id=${item.ideaId}`);
  };

  const handleSchedule = (item: StackItem) => {
    // Navigate to schedule page with content
    const content = item.caption || item.hookExample || item.topic;
    router.push(`/dashboard/schedule?content=${encodeURIComponent(content)}`);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "text_only":
        return FileText;
      case "text_image":
        return ImageIcon;
      case "carousel":
        return BookOpen;
      case "video":
        return Film;
      default:
        return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your stack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-1 sm:mb-2">
                Post Stack
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {stack.length} {stack.length === 1 ? "post" : "posts"} ready to schedule
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/content-ideas")}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-2 text-sm px-4"
            >
              <Plus className="w-4 h-4" />
              Add More
            </Button>
          </div>
        </div>

        {/* Stack List */}
        {stack.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {stack.map((item, index) => {
              const FormatIcon = getFormatIcon(item.format);
              
              return (
                <Card
                  key={index}
                  className="group border border-gray-200 rounded-lg sm:rounded-xl hover:border-gray-300 transition-all duration-300 bg-white"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Topic */}
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                            <FormatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight flex-1">
                            {item.topic}
                          </h3>
                        </div>

                        {/* Caption or Hook */}
                        {item.caption ? (
                          <div className="mb-3 sm:mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">Caption</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                              <p className="text-xs sm:text-sm text-gray-950 leading-relaxed">
                                {item.caption}
                              </p>
                            </div>
                          </div>
                        ) : item.hookExample ? (
                          <div className="mb-3 sm:mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">Hook</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                              <p className="text-xs sm:text-sm text-gray-950 italic leading-relaxed">
                                &ldquo;{item.hookExample}&rdquo;
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                          <Badge className="bg-gray-200 text-gray-800 rounded-lg px-2.5 sm:px-3 py-1 text-xs font-medium">
                            {item.format.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          {item.tone && (
                            <Badge className="bg-gray-200 text-gray-800 rounded-lg px-2.5 sm:px-3 py-1 text-xs font-medium capitalize">
                              {item.tone} tone
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            Saved {formatDate(item.savedAt)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleSchedule(item)}
                            className="w-full sm:w-auto bg-gray-950 hover:bg-gray-900 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                          </Button>
                          <Button
                            onClick={() => handleEdit(item)}
                            className="w-full sm:w-auto bg-gray-950 hover:bg-gray-900 text-white rounded-lg px-4 py-2 text-xs font-semibold"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(index)}
                            className="w-full sm:w-auto bg-gray-950 hover:bg-gray-900 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-gray-200 rounded-lg sm:rounded-xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-950 mb-2">
                Your stack is empty
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Save content ideas to build your post stack
              </p>
              <Button
                onClick={() => router.push("/dashboard/content-ideas")}
                className="bg-gray-950 hover:bg-gray-900 text-white rounded-lg sm:rounded-xl text-sm px-4 sm:px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Browse Content Ideas
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
