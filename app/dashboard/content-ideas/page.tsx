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
    <div className="space-y-8 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-2">
            Daily Content Ideas
          </h1>
          <p className="text-base text-gray-600">
            Fresh ideas tailored for your niche
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/dashboard/settings")}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl"
          >
            Change Niche
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content Ideas List */}
      <div className="space-y-4">
        {contentIdeas.length > 0 ? (
          contentIdeas.map((idea) => {
            const FormatIcon = formatLabels[idea.format].icon;
            
            return (
              <Card key={idea.id} className="bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                <CardContent className="p-5">
                  {/* Topic Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-950 flex-1">
                      {idea.topic}
                    </h3>
                  </div>

                    {/* Hook Example */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 sm:mb-2">Hook Example</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs sm:text-sm text-gray-950 leading-relaxed">
                          &ldquo;{idea.hookExample}&rdquo;
                        </p>
                      </div>
                    </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                      {hookStyleLabels[idea.hookStyle]} Hook
                    </Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1.5">
                      <FormatIcon className="w-3.5 h-3.5" />
                      {formatLabels[idea.format].label}
                    </Badge>
                    {idea.description && (
                      <p className="text-sm text-gray-600 ml-auto">
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleGenerateCaption(idea)}
                      className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                    >
                      Generate Caption
                    </Button>
                    <Button
                      onClick={() => handleSaveToStack(idea)}
                      variant="outline"
                      className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl flex items-center justify-center gap-2"
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
          <Card className="bg-white border border-gray-200 rounded-xl">
            <CardContent className="p-12 text-center">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-950 mb-2">
                No content ideas yet
              </h3>
              <p className="text-base text-gray-600 mb-4">
                We&apos;re working on adding more ideas for your niche
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl"
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
          className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl"
        >
          View Post Stack
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
