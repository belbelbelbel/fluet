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
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  FileTextIcon,
  XIcon,
  CalendarPlusIcon,
  EditIcon,
  DownloadIcon,
  FileTextIcon as FileTextIconExport,
  MoreVerticalIcon,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok";
type Tone = "professional" | "casual" | "funny" | "inspiring" | "educational";
type Style = "concise" | "detailed" | "storytelling" | "list-based";
type Length = "short" | "medium" | "long";

export default function GeneratePage() {
  const { isSignedIn, isLoaded } = useUser();
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

  // Show loading spinner while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Loader2Icon className="w-16 h-16 text-blue-500 animate-spin" />
            <Wand2Icon className="w-8 h-8 text-purple-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header - Consistent */}
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Generate Content
              </h1>
            <p className="text-sm text-gray-500">
              Create engaging social media posts
            </p>
          </div>

          {/* Content Type Selection - Clean */}
          <div className="mb-8">
            <div className="flex gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-colors ${contentType === type
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                    }`}
                >
                    {getContentTypeIcon(type)}
                  <span className="text-xs font-medium hidden sm:inline">{getContentTypeLabel(type)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates & Prompt Input - Clean */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="prompt"
                className="block text-sm font-medium text-gray-300"
            >
              What would you like to create?
            </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showTemplates ? "Hide" : "Templates"}
              </button>
            </div>

            {showTemplates && (
              <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contentTemplates
                    .filter(t => t.contentType === contentType)
                    .map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="text-left p-2.5 bg-gray-800/50 hover:bg-gray-800 rounded-md border border-gray-700 hover:border-blue-500/50 transition-colors"
                      >
                        <div className="font-medium text-white text-xs mb-0.5">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your content idea..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm"
              rows={4}
              disabled={isGenerating}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Be specific for better results
            </p>
              <span className="text-xs text-gray-600">{prompt.length}</span>
            </div>
          </div>

          {/* Customization Options - Simplified */}
          <div className="mb-8">
            <button
              onClick={() => setShowCustomization(!showCustomization)}
              className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>{showCustomization ? "Hide" : "Show"} options</span>
            </button>

            {showCustomization && (
              <div className="mt-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800 space-y-4">
                {/* Tone */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Tone</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tones.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tone === t
                            ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Style</label>
                  <div className="flex flex-wrap gap-1.5">
                    {styles.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${style === s
                            ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Length</label>
                  <div className="flex gap-1.5">
                    {lengths.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${length === l
                            ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
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

          {/* Error Message - Minimal */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button - Clean */}
          <div className="mb-10">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2Icon className="w-4 h-4" />
                  Generate
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
                {/* Modal Header - Minimal */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-white">
                    {getContentTypeLabel(contentType)}
                  </h2>
                  <button
                    onClick={() => setShowContentModal(false)}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-800 rounded"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Content - Clean */}
                <div className="flex-1 overflow-y-auto p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                        <p className="text-xs text-blue-400">
                          Press Ctrl/Cmd + S to save, Esc to cancel
                        </p>
                      </div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[300px] px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm leading-relaxed"
                        placeholder="Edit your content here..."
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {editedContent.length} characters
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900/30 rounded-lg p-5 border border-gray-800">
                      <pre className="whitespace-pre-wrap text-gray-100 font-sans text-sm leading-relaxed">
                        {generatedContent}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Modal Footer - Simplified */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/50 relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>{generatedContent.length} chars</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                          >
                            Save
                          </Button>
                  <Button
                            onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                            className="border-gray-700 text-black hover:bg-gray-800 hover:text-white px-4"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleCopy}
                            size="sm"
                            className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                          >
                            {isCopied ? (
                              <CheckIcon className="w-4 h-4" />
                            ) : (
                              <CopyIcon className="w-4 h-4" />
                            )}
                          </Button>
                          <DropdownMenu
                            trigger={
                              <Button
                                size="sm"
                                className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 px-3"
                                title="More options"
                              >
                                <MoreVerticalIcon className="w-5 h-5" />
                              </Button>
                            }
                          >
                            <DropdownMenuItem
                              onClick={handleEdit}
                              icon={<EditIcon className="w-4 h-4" />}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleExportText}
                              icon={<DownloadIcon className="w-4 h-4" />}
                            >
                              Export as TXT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleExportPDF}
                              icon={<FileTextIconExport className="w-4 h-4" />}
                            >
                              Export as PDF
                            </DropdownMenuItem>
                            <div className="border-t border-gray-800 my-1"></div>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowContentModal(false);
                                handleRegenerate();
                              }}
                              icon={<RefreshCwIcon className="w-4 h-4" />}
                            >
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowContentModal(false);
                                router.push(`/schedule?content=${encodeURIComponent(generatedContent)}&platform=${contentType}`);
                              }}
                              icon={<CalendarPlusIcon className="w-4 h-4" />}
                            >
                              Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowContentModal(false);
                                router.push("/history");
                              }}
                              icon={<FileTextIcon className="w-4 h-4" />}
                            >
                              View History
                            </DropdownMenuItem>
                          </DropdownMenu>
                          <Button
                            onClick={() => setShowContentModal(false)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                          >
                            Done
                  </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Content - Simplified */}
          {generatedContent && (
            <div className="space-y-3">
              {/* Minimal Actions Bar */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="text-sm text-gray-400">{getContentTypeLabel(contentType)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                    title="Copy"
                  >
                    {isCopied ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <CopyIcon className="w-4 h-4" />
                    )}
                  </Button>
                  <DropdownMenu
                    trigger={
                  <Button
                    size="sm"
                        className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-8 w-8 p-0"
                        title="More options"
                      >
                        <MoreVerticalIcon className="w-5 h-5" />
                      </Button>
                    }
                  >
                    <DropdownMenuItem
                      onClick={() => setShowPreview(!showPreview)}
                      icon={<EyeIcon className="w-4 h-4" />}
                    >
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleRegenerate}
                      icon={<RefreshCwIcon className="w-4 h-4" />}
                    >
                    Regenerate
                    </DropdownMenuItem>
                    <div className="border-t border-gray-800 my-1"></div>
                    <DropdownMenuItem
                      onClick={handleExportText}
                      icon={<DownloadIcon className="w-4 h-4" />}
                    >
                      Export TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportPDF}
                      icon={<FileTextIconExport className="w-4 h-4" />}
                    >
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenu>
                </div>
              </div>

              {/* Preview - Simplified */}
              {showPreview && (
                <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                  {renderPreview}
                </div>
              )}

              {/* Content Display - Clean */}
              <div className="p-5 bg-gray-900/30 rounded-lg border border-gray-800">
                <pre className="whitespace-pre-wrap text-gray-100 font-sans text-sm leading-relaxed">
                    {generatedContent}
                  </pre>
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
