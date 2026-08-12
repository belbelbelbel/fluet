"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
// import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Save,
  ArrowLeft,
  RefreshCw,
  Check,
  Lightbulb,
} from "lucide-react";
import { contentIdeasDatabase, ContentIdea, NaijaTone } from "@/lib/content-ideas";
import { showToast } from "@/lib/toast";

function GenerateCaptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const ideaId = searchParams.get("id");
  const clientIdFromQuery = searchParams?.get("clientId") ?? null;

  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<NaijaTone>("mild");
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!ideaId) return;

    const foundInDb = contentIdeasDatabase.find((i) => i.id === ideaId);
    if (foundInDb) {
      setIdea(foundInDb as ContentIdea);
      setGeneratedCaption("");
      setHasGenerated(false);
      return;
    }

    if (ideaId.startsWith("cache_")) {
      fetch(`/api/content-ideas/${ideaId}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.idea) {
            setIdea(data.idea as ContentIdea);
            setGeneratedCaption("");
            setHasGenerated(false);
          } else {
            showToast.error("Not found", "Content idea not found");
            const base = "/dashboard/content-ideas";
            router.push(clientIdFromQuery ? `${base}?clientId=${clientIdFromQuery}` : base);
          }
        })
        .catch(() => {
          showToast.error("Not found", "Content idea not found");
          const base = "/dashboard/content-ideas";
          router.push(clientIdFromQuery ? `${base}?clientId=${clientIdFromQuery}` : base);
        });
      return;
    }

    showToast.error("Not found", "Content idea not found");
    const base = "/dashboard/content-ideas";
    router.push(clientIdFromQuery ? `${base}?clientId=${clientIdFromQuery}` : base);
  }, [ideaId, router, clientIdFromQuery]);

  useEffect(() => {
    if (clientIdFromQuery) {
      fetch(`/api/clients/${clientIdFromQuery}`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => setClientName(d?.client?.name ?? null))
        .catch(() => setClientName(null));
    } else {
      setClientName(null);
    }
  }, [clientIdFromQuery]);

  const handleGenerate = async () => {
    if (!idea) return;

    if (!userId) {
      showToast.error("Authentication required", "Please sign in to generate captions");
      return;
    }

    setIsGenerating(true);
    setGeneratedCaption("");
    setHasGenerated(false);

    try {
      // Create a prompt from the idea
      const prompt = `Create a social media caption for this topic: "${idea.topic}". Use this hook as inspiration: "${idea.hookExample}". Make it engaging and suitable for ${idea.format.replace("_", " ")} format.`;
      
      // Map Naija tone to API tone
      const toneMap: Record<NaijaTone, string> = {
        mild: "professional",
        moderate: "casual",
        heavy: "conversational"
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          prompt,
          contentType: "instagram",
          tone: toneMap[selectedTone],
          style: "engaging",
          length: "medium",
          userId: userId,
          ...(clientIdFromQuery && { clientId: clientIdFromQuery }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate caption");
      }

      const data = await response.json();
      setGeneratedCaption(data.content);
      setHasGenerated(true);
      showToast.success("Generated!", "Your caption is ready");
    } catch (error) {
      console.error("Error generating caption:", error);
      showToast.error("Generation failed", error instanceof Error ? error.message : "Please try again");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedCaption) {
      await navigator.clipboard.writeText(generatedCaption);
      setIsCopied(true);
      showToast.success("Copied!", "Caption copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = () => {
    if (!idea || !generatedCaption) return;

    setIsSaving(true);
    
    // Save to post stack
    const stack = JSON.parse(localStorage.getItem("postStack") || "[]");
    stack.push({
      ideaId: idea.id,
      topic: idea.topic,
      caption: generatedCaption,
      tone: selectedTone,
      format: idea.format,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem("postStack", JSON.stringify(stack));
    
    setIsSaving(false);
    showToast.success("Saved!", "Caption added to your post stack");
    router.push("/dashboard/post-stack");
  };

  if (!idea) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 bg-background`}>
        <RefreshCw className={`w-8 h-8 animate-spin ${
          "text-blue-600 dark:text-purple-400"
        }`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-background`}>
      <div className="max-w-5xl mx-auto lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <button
            onClick={() => router.back()}
            className={`inline-flex items-center text-sm mb-4 sm:mb-6 transition-all duration-200 ${
              "text-gray-600 hover:text-gray-950 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 text-foreground`}>
              Generate Caption
              {clientName && (
                <span className="text-foreground dark:text-purple-400 font-semibold ml-2">
                  for {clientName}
                </span>
              )}
            </h1>
            <p className={`text-sm sm:text-base text-muted-foreground`}>
              Choose your Naija tone and create a custom caption
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Content & Tone */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Content Idea Section */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3 text-muted-foreground`}>
                  Content Idea
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h2 className={`text-xl sm:text-2xl font-bold mb-1 text-foreground`}>
                      {idea.topic}
                    </h2>
                  </div>
                  <div className={`border-l-4 pl-3 sm:pl-4 py-2 ${
                    "border-primary dark:border-purple-500"
                  }`}>
                    <p className={`text-xs sm:text-sm mb-1 text-muted-foreground`}>Hook</p>
                    <p className={`text-sm sm:text-base italic leading-relaxed text-foreground`}>
                      &ldquo;{idea.hookExample}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Naija Tone Selector */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4 text-muted-foreground`}>
                Select Naija Tone
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {(["mild", "moderate", "heavy"] as NaijaTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    disabled={isGenerating}
                    className={`relative p-4 sm:p-5 rounded-xl border transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTone === tone
                        ? "border-primary bg-muted dark:border-purple-500 dark:bg-purple-900/50"
                        : "border-gray-200 bg-white hover:border-purple-200 hover:bg-muted/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-500 dark:hover:bg-purple-900/30"
                    }`}
                  >
                    {selectedTone === tone && (
                      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                        "bg-primary dark:bg-purple-400"
                      }`} />
                    )}
                    <div className={`font-bold text-base mb-2 capitalize ${
                      selectedTone === tone 
                        ? "text-foreground dark:text-purple-300"
                        : "text-foreground"
                    }`}>
                      {tone}
                    </div>
                    <div className={`text-xs leading-relaxed ${
                      selectedTone === tone 
                        ? "text-foreground dark:text-purple-400"
                        : "text-muted-foreground"
                    }`}>
                      {tone === "mild" && "Professional with local phrases"}
                      {tone === "moderate" && "Mix of English & Pidgin"}
                      {tone === "heavy" && "Full Pidgin style"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            {!hasGenerated && (
              <div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full rounded-xl py-3 sm:py-4 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${
                    "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Generating Caption...
                    </>
                  ) : (
                    "Generate Caption"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right Column - Generated Caption */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {!hasGenerated ? (
                <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 ${
                  "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
                }`}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent`}>
                    <Lightbulb className={`w-8 h-8 text-muted-foreground/70`} />
                  </div>
                  <p className={`text-sm text-muted-foreground`}>
                    Your generated caption will appear here
                  </p>
                </div>
              ) : (
                <div className={`border rounded-xl overflow-hidden transition-colors duration-300 border-border bg-card`}>
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        Your Caption
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Regenerate"
                        >
                          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                          title="Copy"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="min-h-[200px]">
                      {isGenerating ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <RefreshCw className={`w-6 h-6 animate-spin mx-auto mb-3 text-muted-foreground`} />
                            <span className={`text-sm text-muted-foreground`}>Generating...</span>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap text-foreground`}>
                          {generatedCaption}
                        </p>
                      )}
                    </div>
                    {generatedCaption && !isGenerating && (
                      <div className={`mt-4 pt-4 border-t flex items-center justify-between transition-colors duration-300 border-border`}>
                        <span className={`text-xs text-muted-foreground`}>
                          {generatedCaption.length} characters
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving || !generatedCaption}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 active:bg-purple-800 text-primary-foreground rounded-lg px-4 py-1.5 text-xs font-medium disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Save className="w-3 h-3 mr-1.5" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            onClick={() =>
                              router.push(
                                clientIdFromQuery
                                  ? `/dashboard/content-ideas?clientId=${clientIdFromQuery}`
                                  : "/dashboard/content-ideas"
                              )
                            }
                            variant="outline"
                            size="sm"
                            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                              "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                            }`}
                          >
                            Another
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GenerateCaptionPage() {
  return (
    <Suspense fallback={
      <LoadingScreen variant="inline" message="Loading caption tool..." />
    }>
      <GenerateCaptionPageInner />
    </Suspense>
  );
}
