"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { exportAsText, exportAsPDF } from "@/lib/export";
import { contentTemplates, type ContentTemplate } from "@/lib/templates";
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
  XIcon,
  CalendarPlusIcon,
  EditIcon,
  SaveIcon,
  DownloadIcon,
  FileTextIcon as FileTextIconExport,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";
type Tone = "professional" | "casual" | "funny" | "inspiring" | "educational";
type Style = "concise" | "detailed" | "storytelling" | "list-based";
type Length = "short" | "medium" | "long";

export default function GeneratePage() {
  const { isSignedIn } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("twitter");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [style, setStyle] = useState<Style>("concise");
  const [length, setLength] = useState<Length>("medium");
  const [showCustomization, setShowCustomization] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const loadingMessages = useMemo(() => [
    "✨ Crafting your perfect content...",
    "🚀 Unleashing AI creativity...",
    "💡 Generating engaging ideas...",
    "🎨 Polishing your content...",
    "⚡ Almost there! Final touches...",
    "🌟 Creating something amazing...",
  ], []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic or prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");
    setShowContentModal(false);

    // Rotate loading messages
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    try {
      if (!userId) {
        clearInterval(messageInterval);
        setIsGenerating(false);
        setError("You must be signed in to generate content. Please sign in and try again.");
        return;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
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
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to generate content";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setEditedContent(data.content);
      setShowContentModal(true);
      showToast.success("Content generated successfully!", "Your content is ready to use");

      // Refresh history if user navigates there
      // The content is already saved by the API
    } catch (err) {
      console.error("Error generating content:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate content";
      setError(errorMessage);
      showToast.error("Failed to generate content", errorMessage);
    } finally {
      setIsGenerating(false);
      if (typeof messageInterval !== 'undefined') {
        clearInterval(messageInterval);
      }
    }
  }, [prompt, contentType, tone, style, length, userId, loadingMessages]);

  const handleCopy = useCallback(async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      showToast.success("Copied to clipboard!", "Content is ready to paste");
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [generatedContent]);

  const handleRegenerate = useCallback(() => {
    setGeneratedContent("");
    setEditedContent("");
    setIsEditing(false);
    handleGenerate();
  }, [handleGenerate]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedContent(generatedContent);
  }, [generatedContent]);

  const handleSaveEdit = useCallback(() => {
    setGeneratedContent(editedContent);
    setIsEditing(false);
    showToast.success("Content updated!", "Your changes have been saved");
  }, [editedContent]);

  const handleCancelEdit = useCallback(() => {
    setEditedContent(generatedContent);
    setIsEditing(false);
  }, [generatedContent]);

  const handleExportText = useCallback(() => {
    if (generatedContent) {
      exportAsText(generatedContent, `${contentType}-content`);
      showToast.success("Exported as text file", "Your content has been downloaded");
    }
  }, [generatedContent, contentType]);

  const getContentTypeLabel = useCallback((type: ContentType) => {
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
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (generatedContent) {
      await exportAsPDF(generatedContent, getContentTypeLabel(contentType));
      showToast.success("PDF ready to print", "Use your browser's print dialog to save as PDF");
    }
  }, [generatedContent, contentType, getContentTypeLabel]);

  const handleUseTemplate = useCallback((template: ContentTemplate) => {
    setPrompt(template.prompt);
    setContentType(template.contentType);
    if (template.tone) setTone(template.tone);
    if (template.style) setStyle(template.style);
    setShowTemplates(false);
    showToast.success("Template applied!", `Using "${template.name}" template`);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
        e.preventDefault();
        handleGenerate();
      }
      // Escape to close modal
      if (e.key === 'Escape' && showContentModal) {
        setShowContentModal(false);
        setIsEditing(false);
      }
      // Ctrl/Cmd + E to edit
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && generatedContent && !isEditing) {
        e.preventDefault();
        handleEdit();
      }
      // Ctrl/Cmd + S to save edit
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSaveEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, prompt, showContentModal, generatedContent, isEditing, handleGenerate, handleEdit, handleSaveEdit]);

  const getContentTypeIcon = useCallback((type: ContentType) => {
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
  }, []);

  const previewStyles = useMemo<Record<ContentType, string>>(() => ({
    twitter: "bg-white text-black p-4 rounded-lg max-w-md mx-auto",
    instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-lg max-w-md mx-auto",
    linkedin: "bg-blue-50 text-gray-900 p-6 rounded-lg max-w-2xl mx-auto",
    tiktok: "bg-black text-white p-4 rounded-lg max-w-sm mx-auto",
  }), []);

  const renderPreview = useMemo(() => {
    if (!generatedContent) return null;

    return (
      <div className={`${previewStyles[contentType]} shadow-xl`}>
        <div className="text-sm opacity-70 mb-2">{getContentTypeLabel(contentType)} Preview</div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {generatedContent}
        </div>
      </div>
    );
  }, [generatedContent, contentType, previewStyles, getContentTypeLabel]);

  const contentTypes = useMemo(() => (["twitter", "instagram", "linkedin", "tiktok"] as ContentType[]), []);
  const tones = useMemo(() => (["professional", "casual", "funny", "inspiring", "educational"] as Tone[]), []);
  const styles = useMemo(() => (["concise", "detailed", "storytelling", "list-based"] as Style[]), []);
  const lengths = useMemo(() => (["short", "medium", "long"] as Length[]), []);

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

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-black to-gray-900 text-gray-100">
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
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${contentType === type
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

          {/* Templates & Prompt Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="prompt"
                className="block text-sm font-semibold text-gray-200"
              >
                What would you like to create?
              </label>
              <Button
                onClick={() => setShowTemplates(!showTemplates)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-black hover:bg-blue-600/20 hover:text-white text-xs"
              >
                 Templates
              </Button>
            </div>

            {showTemplates && (
              <div className="mb-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-3">Content Templates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contentTemplates
                    .filter(t => t.contentType === contentType)
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="text-left p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 transition-all"
                      >
                        <div className="font-medium text-white text-sm mb-1">{template.name}</div>
                        <div className="text-xs text-gray-400">{template.description}</div>
                      </button>
                    ))}
                </div>
                {contentTemplates.filter(t => t.contentType === contentType).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No templates available for this platform</p>
                )}
              </div>
            )}
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your content idea... 

Examples:
• A Twitter thread about the future of AI
• An Instagram caption for a sunset photo
• A LinkedIn post about productivity tips
• A TikTok video script about morning routines"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              rows={5}
              disabled={isGenerating}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                💡 Tip: Be specific about your topic and key points for better results
              </p>
              <span className="text-xs text-gray-600">{prompt.length} characters</span>
            </div>
          </div>

          {/* Customization Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{showCustomization ? "Hide" : "Show"} Advanced Options</span>
            </button>

            {showCustomization && (
              <div className="mt-4 p-5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 space-y-5 shadow-lg">
                {/* Tone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Content Tone
                    <span className="text-xs font-normal text-gray-500 ml-2">How should it sound?</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {tones.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${tone === t
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-102"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Writing Style
                    <span className="text-xs font-normal text-gray-500 ml-2">How should it be structured?</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {styles.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${style === s
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-102"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Content Length
                    <span className="text-xs font-normal text-gray-500 ml-2">How detailed should it be?</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {lengths.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${length === l
                          ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-102"
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

          {/* Loading Modal */}
          {isGenerating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Loader2Icon className="w-16 h-16 text-blue-500 animate-spin" />
                      <Wand2Icon className="w-8 h-8 text-purple-500 absolute -top-2 -right-2 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {loadingMessage || "✨ Crafting your perfect content..."}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Our AI is working its magic to create something amazing for you
                  </p>
                  <div className="mt-6 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Modal */}
          {showContentModal && generatedContent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowContentModal(false)}
            >
              <div
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {getContentTypeLabel(contentType)} Ready!
                      </h2>
                      <p className="text-sm text-gray-400">Your content has been generated</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm text-blue-400 flex items-center">
                          <EditIcon className="w-4 h-4 mr-2" />
                          Editing mode - Press Ctrl/Cmd + S to save, Esc to cancel
                        </p>
                      </div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[300px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                        placeholder="Edit your content here..."
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{editedContent.length} characters</span>
                        <span>Press Ctrl/Cmd + S to save</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-200 font-sans text-base leading-relaxed">
                          {generatedContent}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Content generated successfully • {generatedContent.length} characters</span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <SaveIcon className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleEdit}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                          >
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                          >
                            {isCopied ? (
                              <>
                                <CheckIcon className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <CopyIcon className="w-4 h-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleExportText}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                            title="Export as text file"
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Export TXT
                          </Button>
                          <Button
                            onClick={handleExportPDF}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                            title="Export as PDF"
                          >
                            <FileTextIconExport className="w-4 h-4 mr-2" />
                            Export PDF
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => {
                          setShowContentModal(false);
                          handleRegenerate();
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-900 dark:text-gray-300 hover:bg-gray-700 dark:hover:text-white"
                        disabled={isGenerating}
                      >
                        <RefreshCwIcon className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        onClick={() => {
                          setShowContentModal(false);
                          router.push(`/schedule?content=${encodeURIComponent(generatedContent)}&platform=${contentType}`);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                      >
                        <CalendarPlusIcon className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                      <Button
                        onClick={() => {
                          setShowContentModal(false);
                          router.push("/history");
                        }}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        View History
                      </Button>
                      <Button
                        onClick={() => setShowContentModal(false)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    className="border-gray-600 text-black hover:bg-gray-700"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {showPreview ? "Hide" : "Preview"}
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-black hover:bg-gray-700"
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
                    className="border-gray-600 text-black hover:bg-gray-700"
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
                  {renderPreview}
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
      <KeyboardShortcuts />
    </div>
  );
}
