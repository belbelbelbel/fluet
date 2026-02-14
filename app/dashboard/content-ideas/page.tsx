"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Image as ImageIcon,
  Film,
  FileText,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { getDailyContentIdeas, ContentIdea, Niche, HookStyle, Format } from "@/lib/content-ideas";
import { showToast } from "@/lib/toast";

const hookStyleLabels: Record<HookStyle, string> = {
  story: "Story",
  question: "Question",
  shock: "Shock",
  value: "Value",
  tip: "Tip",
};

const formatLabels: Record<Format, { label: string; icon: LucideIcon }> = {
  text_only: { label: "Text Only", icon: FileText },
  text_image: { label: "Text + Image", icon: ImageIcon },
  carousel: { label: "Carousel", icon: BookOpen },
  video: { label: "Video", icon: Film },
};

export default function ContentIdeasPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [niche, setNiche] = useState<Niche | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get niche from localStorage - non-blocking
    const savedNiche = localStorage.getItem("userNiche") as Niche;
    if (savedNiche) {
      setNiche(savedNiche);
      // Load content ideas asynchronously without blocking render
      setTimeout(() => loadContentIdeas(savedNiche), 0);
    } else {
      // Redirect to onboarding if no niche selected
      router.push("/dashboard/onboarding");
    }

    // Listen for niche changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userNiche" && e.newValue) {
        const newNiche = e.newValue as Niche;
        setNiche(newNiche);
        loadContentIdeas(newNiche);
        showToast.success("Niche updated!", "Content ideas refreshed");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  const loadContentIdeas = (userNiche: Niche) => {
    setLoading(true);
    // Use requestIdleCallback for non-blocking execution
    const loadIdeas = () => {
      try {
        const ideas = getDailyContentIdeas(userNiche, 5);
        setContentIdeas(ideas);
      } catch (error) {
        console.error("Error loading content ideas:", error);
        showToast.error("Error", "Failed to load content ideas");
      } finally {
        setLoading(false);
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number }).requestIdleCallback?.(loadIdeas, { timeout: 100 });
    } else {
      setTimeout(loadIdeas, 0);
    }
  };

  const handleRefresh = () => {
    if (niche) {
      loadContentIdeas(niche);
      showToast.success("Refreshed!", "New content ideas loaded");
    }
  };

  const handleGenerateCaption = (idea: ContentIdea) => {
    router.push(`/dashboard/generate-caption?id=${idea.id}`);
  };

  const handleSaveToStack = (idea: ContentIdea) => {
    // Save to post stack (localStorage for now)
    const stack = JSON.parse(localStorage.getItem("postStack") || "[]");
    stack.push({
      ideaId: idea.id,
      topic: idea.topic,
      hookExample: idea.hookExample,
      format: idea.format,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem("postStack", JSON.stringify(stack));
    showToast.success("Saved!", "Added to your post stack");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center">
          <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-4 ${
            isDark ? "text-purple-400" : "text-blue-600"
          }`} />
          <p className={isDark ? "text-slate-300" : "text-gray-600"}>Loading content ideas...</p>
        </div>
      </div>
    );
  }

  if (!niche) {
    return null;
  }

  return (
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b transition-colors duration-300 ${
        isDark ? "border-slate-700" : "border-gray-200"
      }`}>
        <div className="flex-1 min-w-0">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>
            Daily Content Ideas
          </h1>
          <p className={`text-sm sm:text-base ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Fresh ideas tailored for your niche
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={() => router.push("/dashboard/settings")}
            variant="outline"
            className={`flex-1 sm:flex-none rounded-xl text-xs sm:text-sm transition-all duration-200 ${
              isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            Change Niche
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className={`flex-1 sm:flex-none rounded-xl text-xs sm:text-sm transition-all duration-200 ${
              isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content Ideas List */}
      <div className="space-y-3 sm:space-y-4">
        {contentIdeas.length > 0 ? (
          contentIdeas.map((idea) => {
            const FormatIcon = formatLabels[idea.format].icon;
            
            return (
              <Card key={idea.id} className={`border rounded-xl transition-all duration-200 ${
                isDark 
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <CardContent className="p-4 sm:p-5">
                  {/* Topic Header */}
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? "bg-purple-500/20" : "bg-purple-100"
                    }`}>
                      <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isDark ? "text-purple-400" : "text-purple-600"
                      }`} />
                    </div>
                    <h3 className={`text-base sm:text-lg font-semibold flex-1 leading-tight ${
                      isDark ? "text-white" : "text-gray-950"
                    }`}>
                      {idea.topic}
                    </h3>
                  </div>

                    {/* Hook Example */}
                    <div className="mb-3 sm:mb-4">
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>Hook Example</p>
                      <div className={`border rounded-lg p-2.5 sm:p-3 ${
                        isDark 
                          ? "bg-slate-900/50 border-slate-700" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <p className={`text-xs sm:text-sm leading-relaxed ${
                          isDark ? "text-slate-200" : "text-gray-950"
                        }`}>
                          &ldquo;{idea.hookExample}&rdquo;
                        </p>
                      </div>
                    </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className={`${
                      isDark 
                        ? "bg-slate-700 text-slate-200 border-slate-600" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {hookStyleLabels[idea.hookStyle]} Hook
                    </Badge>
                    <Badge className={`flex items-center gap-1.5 ${
                      isDark 
                        ? "bg-slate-700 text-slate-200 border-slate-600" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      <FormatIcon className="w-3.5 h-3.5" />
                      {formatLabels[idea.format].label}
                    </Badge>
                    {idea.description && (
                      <p className={`text-sm ml-auto ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t transition-colors duration-300 ${
                    isDark ? "border-slate-700" : "border-gray-200"
                  }`}>
                    <Button
                      onClick={() => handleGenerateCaption(idea)}
                      className={`flex-1 text-white rounded-xl py-2.5 sm:py-2 text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                        isDark
                          ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
                          : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950"
                      }`}
                    >
                      Generate Caption
                    </Button>
                    <Button
                      onClick={() => handleSaveToStack(idea)}
                      variant="outline"
                      className={`flex-1 rounded-xl flex items-center justify-center gap-2 py-2.5 sm:py-2 text-sm transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Save to Stack
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              );
            })
        ) : (
          <Card className={`border rounded-xl transition-colors duration-300 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-12 text-center">
              <Lightbulb className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                No content ideas yet
              </h3>
              <p className={`text-base mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                We&apos;re working on adding more ideas for your niche
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Stack Button */}
      <div className="text-center pt-4">
        <Button
          onClick={() => router.push("/dashboard/post-stack")}
          variant="outline"
          className={`rounded-xl transition-all duration-200 ${
            isDark
              ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
              : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
          }`}
        >
          View Post Stack
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
