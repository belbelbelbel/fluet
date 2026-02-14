"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
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
  ArrowRight,
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center">
          <Clock className={`w-8 h-8 animate-pulse mx-auto mb-4 ${
            isDark ? "text-purple-400" : "text-purple-600"
          }`} />
          <p className={isDark ? "text-slate-300" : "text-gray-600"}>Loading your stack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-4 sm:py-6 lg:py-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                Post Stack
              </h1>
              <p className={isDark ? "text-slate-400" : "text-gray-600"}>
                {stack.length} {stack.length === 1 ? "post" : "posts"} ready to schedule
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/content-ideas")}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-2 text-sm px-4 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add More
            </Button>
          </div>
        </div>

        {/* Stack List */}
        {stack.length > 0 ? (
          <div className="space-y-4">
            {stack.map((item, index) => {
              const FormatIcon = getFormatIcon(item.format);
              
              return (
                <Card
                  key={index}
                  className={`border rounded-xl hover:border-gray-300 transition-all ${
                    isDark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200"
                  }`}
                >
                  <CardContent className="p-5">
                    {/* Topic Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDark ? "bg-purple-500/20" : "bg-purple-100"
                      }`}>
                        <FormatIcon className={`w-5 h-5 ${
                          isDark ? "text-purple-400" : "text-purple-600"
                        }`} />
                      </div>
                      <h3 className={`text-lg font-semibold flex-1 ${
                        isDark ? "text-white" : "text-gray-950"
                      }`}>
                        {item.topic}
                      </h3>
                    </div>

                    {/* Caption or Hook */}
                    {item.caption ? (
                      <div className="mb-4">
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}>Caption</p>
                        <div className={`border rounded-lg p-3 ${
                          isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
                        }`}>
                          <p className={`text-sm leading-relaxed ${
                            isDark ? "text-slate-200" : "text-gray-950"
                          }`}>
                            {item.caption}
                          </p>
                        </div>
                      </div>
                    ) : item.hookExample ? (
                      <div className="mb-4">
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                          isDark ? "text-slate-400" : "text-gray-600"
                        }`}>Hook Example</p>
                        <div className={`border rounded-lg p-3 ${
                          isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
                        }`}>
                          <p className={`text-sm leading-relaxed ${
                            isDark ? "text-slate-200" : "text-gray-950"
                          }`}>
                            &ldquo;{item.hookExample}&rdquo;
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        isDark 
                          ? "bg-slate-700 text-slate-200" 
                          : "bg-gray-200 text-gray-800"
                      }`}>
                        {item.format.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                      {item.tone && (
                        <Badge className={`rounded-lg px-3 py-1 text-xs font-medium capitalize ${
                          isDark 
                            ? "bg-slate-700 text-slate-200" 
                            : "bg-gray-200 text-gray-800"
                        }`}>
                          {item.tone} tone
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t ${
                      isDark ? "border-slate-700" : "border-gray-200"
                    }`}>
                      <Button
                        onClick={() => handleSchedule(item)}
                        className={`flex-1 rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                          isDark
                            ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                            : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(item)}
                          variant="outline"
                          className={`flex-1 sm:flex-none rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium transition-all duration-200 ${
                            isDark
                              ? "border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white active:bg-slate-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200"
                          }`}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(index)}
                          variant="outline"
                          className={`rounded-lg px-4 py-2.5 sm:py-2 text-sm font-medium transition-all duration-200 ${
                            isDark
                              ? "border-slate-600 text-red-400 hover:bg-red-950/30 hover:border-red-500 hover:text-red-300 active:bg-red-950/50"
                              : "border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 active:bg-red-100"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className={`border rounded-xl ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-8 sm:p-12 text-center">
              <Calendar className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <h3 className={`text-base sm:text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                Your stack is empty
              </h3>
              <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                Save content ideas to build your post stack
              </p>
              <Button
                onClick={() => router.push("/dashboard/content-ideas")}
                className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg sm:rounded-xl text-sm px-4 sm:px-6 transition-all duration-200 shadow-sm hover:shadow-md"
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
