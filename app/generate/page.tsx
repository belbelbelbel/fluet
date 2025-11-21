"use client";

import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  Wand2Icon,
  CopyIcon,
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
  EyeIcon,
  SettingsIcon,
  BotIcon,
  FileTextIcon,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";
type Tone = "professional" | "casual" | "funny" | "inspiring" | "educational";
type Style = "concise" | "detailed" | "storytelling" | "list-based";
type Length = "short" | "medium" | "long";

export default function GeneratePage() {
  const { isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const [contentType, setContentType] = useState<ContentType>("twitter");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [style, setStyle] = useState<Style>("concise");
  const [length, setLength] = useState<Length>("medium");
  const [showCustomization, setShowCustomization] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="text-gray-400">You need to be signed in to generate content.</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic or prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          contentType,
          tone,
          style,
          length,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      console.error("Error generating content:", err);
      setError(err instanceof Error ? err.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent("");
    handleGenerate();
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case "twitter":
        return <TwitterIcon className="w-5 h-5" />;
      case "instagram":
        return <InstagramIcon className="w-5 h-5" />;
      case "linkedin":
        return <LinkedinIcon className="w-5 h-5" />;
      case "tiktok":
        return <MusicIcon className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "twitter":
        return "Twitter Thread";
      case "instagram":
        return "Instagram Caption";
      case "linkedin":
        return "LinkedIn Post";
      case "tiktok":
        return "TikTok Content";
    }
  };

  const renderPreview = () => {
    if (!generatedContent) return null;

    const previewStyles: Record<ContentType, string> = {
      twitter: "bg-white text-black p-4 rounded-lg max-w-md mx-auto",
      instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-lg max-w-md mx-auto",
      linkedin: "bg-blue-50 text-gray-900 p-6 rounded-lg max-w-2xl mx-auto",
      tiktok: "bg-black text-white p-4 rounded-lg max-w-sm mx-auto",
    };

    return (
      <div className={`${previewStyles[contentType]} shadow-xl`}>
        <div className="text-sm opacity-70 mb-2">{getContentTypeLabel(contentType)} Preview</div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {generatedContent}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <BotIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Generate AI Content
              </h1>
            </div>
            <p className="text-gray-400 text-base sm:text-lg px-4">
              Create engaging social media content with AI
            </p>
          </div>

          {/* Content Type Selection */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3 px-1">
              Select Platform
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {(["twitter", "instagram", "linkedin", "tiktok"] as ContentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    contentType === type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {getContentTypeIcon(type)}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{getContentTypeLabel(type)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              What would you like to create?
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A thread about the future of AI, A caption for a sunset photo, A post about productivity tips, A TikTok video about morning routines..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about your topic and any key points you want included
            </p>
          </div>

          {/* Customization Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Customize Output</span>
            </button>

            {showCustomization && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tone
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(["professional", "casual", "funny", "inspiring", "educational"] as Tone[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-2 rounded text-xs capitalize transition-all ${
                          tone === t
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["concise", "detailed", "storytelling", "list-based"] as Style[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-3 py-2 rounded text-xs capitalize transition-all ${
                          style === s
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["short", "medium", "long"] as Length[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`px-3 py-2 rounded text-xs capitalize transition-all ${
                          length === l
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              <p className="font-semibold">Error: {error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="mb-6 sm:mb-8">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2Icon className="w-5 h-5 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm text-gray-400">Generated {getContentTypeLabel(contentType)}</span>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {showPreview ? "Hide" : "Preview"}
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {isCopied ? (
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
                    onClick={handleRegenerate}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={isGenerating}
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  {renderPreview()}
                </div>
              )}

              {/* Content Display */}
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-200 font-sans text-sm leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedContent && !isGenerating && (
            <div className="mt-12 text-center text-gray-500">
              <FileTextIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Your generated content will appear here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
