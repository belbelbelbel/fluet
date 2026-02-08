"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function GenerateCaptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const ideaId = searchParams.get("id");

  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [selectedTone, setSelectedTone] = useState<NaijaTone>("mild");
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (ideaId) {
      const foundIdea = contentIdeasDatabase.find((i) => i.id === ideaId);
      if (foundIdea) {
        setIdea(foundIdea);
        // Don't auto-set caption - user needs to click Generate
        setGeneratedCaption("");
        setHasGenerated(false);
      } else {
        showToast.error("Not found", "Content idea not found");
        router.push("/dashboard/content-ideas");
      }
    }
  }, [ideaId, router]);

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
          contentType: "instagram", // Default to Instagram for captions
          tone: toneMap[selectedTone],
          style: "engaging",
          length: "medium",
          userId: userId, // Include userId in request body
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-950 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-950 mb-2">
              Generate Caption
            </h1>
            <p className="text-gray-600">
              Choose your Naija tone and create a custom caption
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content & Tone */}
          <div className="lg:col-span-2 space-y-8">
            {/* Content Idea Section */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Content Idea
                </p>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-950 mb-1">
                      {idea.topic}
                    </h2>
                  </div>
                  <div className="border-l-4 border-purple-600 pl-4 py-2">
                    <p className="text-sm text-gray-500 mb-1">Hook</p>
                    <p className="text-base text-gray-950 italic leading-relaxed">
                      "{idea.hookExample}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Naija Tone Selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Select Naija Tone
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["mild", "moderate", "heavy"] as NaijaTone[]).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    disabled={isGenerating}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedTone === tone
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/30"
                    }`}
                  >
                    {selectedTone === tone && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-purple-600 rounded-full" />
                    )}
                    <div className={`font-bold text-base mb-2 capitalize ${
                      selectedTone === tone ? "text-purple-700" : "text-gray-950"
                    }`}>
                      {tone}
                    </div>
                    <div className={`text-xs leading-relaxed ${
                      selectedTone === tone ? "text-purple-600" : "text-gray-600"
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
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
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Your generated caption will appear here
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        Your Caption
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Regenerate"
                        >
                          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
                            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
                            <span className="text-sm text-gray-600">Generating...</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-950 leading-relaxed whitespace-pre-wrap">
                          {generatedCaption}
                        </p>
                      )}
                    </div>
                    {generatedCaption && !isGenerating && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {generatedCaption.length} characters
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving || !generatedCaption}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium disabled:opacity-50"
                          >
                            <Save className="w-3 h-3 mr-1.5" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            onClick={() => router.push("/dashboard/content-ideas")}
                            variant="outline"
                            size="sm"
                            className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-1.5 text-xs font-medium"
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
