"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const formatLabels: Record<Format, { label: string; icon: any }> = {
  text_only: { label: "Text Only", icon: FileText },
  text_image: { label: "Text + Image", icon: ImageIcon },
  carousel: { label: "Carousel", icon: BookOpen },
  video: { label: "Video", icon: Film },
};

export default function ContentIdeasPage() {
  const router = useRouter();
  const [niche, setNiche] = useState<Niche | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);

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
      (window as any).requestIdleCallback(loadIdeas, { timeout: 100 });
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
    setSelectedIdea(idea);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading content ideas...</p>
        </div>
      </div>
    );
  }

  if (!niche) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-1 sm:mb-2">
                Daily Content Ideas
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Fresh ideas tailored for your niche
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => router.push("/dashboard/settings")}
                variant="outline"
                className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-3 sm:px-4"
              >
                Change Niche
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl px-3 sm:px-4"
              >
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Ideas List */}
        <div className="space-y-3 sm:space-y-4">
          {contentIdeas.length > 0 ? (
            contentIdeas.map((idea) => {
              const FormatIcon = formatLabels[idea.format].icon;
              
              return (
                <Card key={idea.id} className="group border border-gray-200 rounded-lg sm:rounded-xl hover:border-gray-300 transition-all duration-300 bg-white overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    {/* Topic Header */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-950 tracking-tight flex-1">
                        {idea.topic}
                      </h3>
                    </div>

                    {/* Hook Example */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">Hook Example</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-gray-950 italic leading-relaxed">
                          "{idea.hookExample}"
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-start sm:items-center gap-2 mb-3 sm:mb-4">
                      <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-gray-200 text-gray-800 font-medium text-xs">
                        {hookStyleLabels[idea.hookStyle]} Hook
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-gray-200 text-gray-800 font-medium text-xs flex items-center gap-1.5">
                        <FormatIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {formatLabels[idea.format].label}
                      </span>
                      {idea.description && (
                        <div className="flex-1 min-w-0 w-full sm:w-auto mt-2 sm:mt-0">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {idea.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => handleGenerateCaption(idea)}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-xs font-semibold"
                      >
                        Generate Caption
                      </Button>
                      <Button
                        onClick={() => handleSaveToStack(idea)}
                        className="w-full sm:w-auto bg-gray-950 hover:bg-gray-900 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Save to Stack
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border border-gray-200 rounded-lg sm:rounded-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-950 mb-2">
                  No content ideas yet
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  We're working on adding more ideas for your niche
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl text-sm"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* View Stack Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <Button
            onClick={() => router.push("/dashboard/post-stack")}
            variant="outline"
            className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl text-sm px-4 sm:px-6"
          >
            View Post Stack
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
