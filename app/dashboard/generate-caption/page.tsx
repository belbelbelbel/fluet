"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Copy,
  Save,
  ArrowLeft,
  RefreshCw,
  Check,
} from "lucide-react";
import { contentIdeasDatabase, ContentIdea, NaijaTone } from "@/lib/content-ideas";
import { showToast } from "@/lib/toast";

export default function GenerateCaptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("id");

  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [selectedTone, setSelectedTone] = useState<NaijaTone>("mild");
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ideaId) {
      const foundIdea = contentIdeasDatabase.find((i) => i.id === ideaId);
      if (foundIdea) {
        setIdea(foundIdea);
        setGeneratedCaption(foundIdea.naijaTone[selectedTone]);
      } else {
        showToast.error("Not found", "Content idea not found");
        router.push("/dashboard/content-ideas");
      }
    }
  }, [ideaId, router, selectedTone]);

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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-6 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Caption
          </h1>
          <p className="text-gray-600">
            Choose your Naija tone and get your caption ready
          </p>
        </div>

        {/* Topic Card - Professional */}
        <Card className="border border-gray-200 rounded-2xl mb-6 bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardContent className="p-8">
            {/* Topic Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-950 flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topic</p>
                <h3 className="text-3xl font-bold text-gray-950 tracking-tight">
                  {idea.topic}
                </h3>
              </div>
            </div>
            
            {/* Hook Example - Professional */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Hook Example</p>
              <div className="bg-gray-950/5 border border-gray-200 rounded-xl p-6">
                <p className="text-lg text-gray-900 italic leading-relaxed font-medium">
                  "{idea.hookExample}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Naija Tone Selector - Professional */}
        <Card className="border border-gray-200 rounded-2xl mb-6 bg-white shadow-sm">
          <CardContent className="p-8">
            <label className="block text-sm font-bold text-gray-950 mb-6 uppercase tracking-wider">
              Naija Tone
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(["mild", "moderate", "heavy"] as NaijaTone[]).map((tone) => (
                <button
                  key={tone}
                  onClick={() => {
                    setSelectedTone(tone);
                    setGeneratedCaption(idea.naijaTone[tone]);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                    selectedTone === tone
                      ? "border-gray-950 bg-gray-950 text-white shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 text-gray-900"
                  }`}
                >
                  <div className={`font-bold text-lg mb-2 capitalize ${
                    selectedTone === tone ? "text-white" : "text-gray-950"
                  }`}>
                    {tone}
                  </div>
                  <div className={`text-xs leading-relaxed ${
                    selectedTone === tone ? "text-gray-200" : "text-gray-600"
                  }`}>
                    {tone === "mild" && "Professional with local phrases"}
                    {tone === "moderate" && "Mix of English & Pidgin"}
                    {tone === "heavy" && "Full Pidgin style"}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generated Caption - Professional */}
        <Card className="border border-gray-200 rounded-2xl mb-6 bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <label className="block text-sm font-bold text-gray-950 uppercase tracking-wider">
                Your Caption
              </label>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-950 hover:border-gray-950 hover:text-white rounded-xl px-4 py-2 font-semibold transition-all"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-gray-950/5 border border-gray-200 rounded-xl p-8 min-h-[200px]">
              <p className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                {generatedCaption}
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-right font-semibold">
              {generatedCaption.length} characters
            </div>
          </CardContent>
        </Card>

        {/* Actions - Professional */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !generatedCaption}
            className="flex-1 bg-gray-950 hover:bg-gray-900 text-white rounded-xl py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Save to Stack"}
          </Button>
          <Button
            onClick={() => router.push("/dashboard/content-ideas")}
            variant="outline"
            className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-950 hover:border-gray-950 hover:text-white rounded-xl py-6 text-base font-semibold transition-all"
          >
            Generate Another
          </Button>
        </div>
      </div>
    </div>
  );
}
