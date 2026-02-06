"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Daily Content Ideas
              </h1>
              <p className="text-gray-600">
                Fresh ideas tailored for your niche
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/dashboard/settings")}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
              >
                Change Niche
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content Ideas List */}
        <div className="space-y-4">
          {contentIdeas.length > 0 ? (
            contentIdeas.map((idea) => {
              const FormatIcon = formatLabels[idea.format].icon;
              
              return (
                <Card key={idea.id} className="group border border-gray-200 rounded-2xl hover:border-gray-300 transition-all duration-300 bg-white overflow-hidden">
                  <CardContent className="p-8">
                    {/* Topic Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-7 h-7 text-gray-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-950 tracking-tight">
                        {idea.topic}
                      </h3>
                    </div>

                    {/* Hook Example - Vibrant */}
                    <div className="mb-6">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hook Example</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <p className="text-base text-gray-900 italic leading-relaxed font-medium">
                          "{idea.hookExample}"
                        </p>
                      </div>
                    </div>

                    {/* Badges - Vibrant Colors */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold text-xs">
                        {hookStyleLabels[idea.hookStyle]} Hook
                      </span>
                      <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold text-xs flex items-center gap-2">
                        <FormatIcon className="w-4 h-4" />
                        {formatLabels[idea.format].label}
                      </span>
                      {idea.description && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {idea.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions - Vibrant */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
                      <Button
                        onClick={() => handleGenerateCaption(idea)}
                        className="bg-gray-950 hover:bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Caption
                      </Button>
                      <Button
                        onClick={() => handleSaveToStack(idea)}
                        className="bg-gray-950 hover:bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2"
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
            <Card className="border border-gray-200 rounded-xl">
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No content ideas yet
                </h3>
                <p className="text-gray-600 mb-4">
                  We're working on adding more ideas for your niche
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* View Stack Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push("/dashboard/post-stack")}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            View Post Stack
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
