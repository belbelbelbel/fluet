"use client";
import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertBanner, type AlertBannerItem } from "@/components/AlertBanner";
import { showToast } from "@/lib/toast";
import { exportAsText, exportAsPDF } from "@/lib/export";
import { contentTemplates, ContentTemplate } from "@/lib/templates";
import { GENERATION_MODE_LABELS, type GenerationMode } from "@/utils/ai/prompt-builder";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  PlayIcon,
  CalendarIcon,
  CopyIcon,
  EditIcon,
  FileTextIcon,
  Loader2Icon,
  X as XIcon,
  RefreshCwIcon,
  DownloadIcon,
  EyeIcon,
} from "lucide-react";

type ContentType = "twitter" | "instagram" | "linkedin" | "tiktok" | "youtube";
type Tone = "professional" | "casual" | "funny" | "inspiring" | "educational";
type Style = "concise" | "detailed" | "storytelling" | "list-based";
type Length = "short" | "medium" | "long";

interface RecentContent {
  id: string;
  platform: ContentType;
  content: string;
  status: "Generated" | "Published" | "Scheduled";
  date: string;
  scheduledDate?: string;
}

function DashboardGeneratePageInner() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientIdFromQuery = searchParams?.get("clientId") ?? null;
  const [clientName, setClientName] = useState<string | null>(null);
  const [brandVoice, setBrandVoice] = useState<{ brandDescription?: string; targetAudience?: string } | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("standard");

  useEffect(() => {
    if (!clientIdFromQuery) {
      setClientName(null);
      setBrandVoice(null);
      return;
    }
    const fetchClient = async () => {
      try {
        const [clientRes, bvRes] = await Promise.all([
          fetch(`/api/clients/${clientIdFromQuery}`, { credentials: "include" }),
          fetch(`/api/clients/${clientIdFromQuery}/brand-voice`, { credentials: "include" }),
        ]);
        if (clientRes.ok) {
          const data = await clientRes.json();
          setClientName(data?.client?.name ?? data?.name ?? null);
        } else {
          setClientName(null);
        }
        if (bvRes.ok) {
          const bvData = await bvRes.json();
          const bv = bvData?.brandVoice;
          if (bv && (bv.brandDescription || bv.targetAudience || bv.tone || bv.industry)) {
            setBrandVoice({
              brandDescription: bv.brandDescription,
              targetAudience: bv.targetAudience,
            });
          } else {
            setBrandVoice(null);
          }
        } else {
          setBrandVoice(null);
        }
      } catch {
        setClientName(null);
        setBrandVoice(null);
      }
    };
    fetchClient();
  }, [clientIdFromQuery]);

  // Generation form state
  const [contentType, setContentType] = useState<ContentType>("twitter");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [style, setStyle] = useState<Style>("concise");
  const [length, setLength] = useState<Length>("medium");
  const [showOptions, setShowOptions] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showContentModal, setShowContentModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const loadingMessages = useMemo(
    () => [
      "Crafting your content…",
      "Applying brand voice…",
      "Polishing the copy…",
      "Almost ready…",
      "Finalizing your post…",
    ],
    []
  );

  // Recent content - fetch from API
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Block generate when payment overdue or credits exceeded (from dashboard banners)
  const [alertBanners, setAlertBanners] = useState<AlertBannerItem[]>([]);
  const actionsBlocked = useMemo(
    () => alertBanners.some((b) => b.variant === "payment_overdue" || b.variant === "credits_exceeded"),
    [alertBanners]
  );

  useEffect(() => {
    if (!userId) return;
    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/activity", { credentials: "include" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const banners: AlertBannerItem[] = list
          .filter((a: { type: string }) =>
            ["payment_overdue", "credits_warning", "credits_exceeded"].includes(a.type)
          )
          .map((a: { id: string; type: string; message: string; clientName?: string; link?: string }) => ({
            id: a.id,
            variant: a.type as AlertBannerItem["variant"],
            message: a.message,
            clientName: a.clientName,
            link: a.link,
          }));
        setAlertBanners(banners);
      } catch {
        setAlertBanners([]);
      }
    };
    loadAlerts();
  }, [userId]);

  const fetchRecentContent = useCallback(async () => {
    if (!userId) {
      setRecentContent([]);
      return;
    }
    try {
      setLoadingRecent(true);
      const url = `/api/content?limit=5${userId ? '&userId=' + userId : ''}${clientIdFromQuery ? '&clientId=' + clientIdFromQuery : ''}`;
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const formatted = data.slice(0, 5).map((item: { id?: string | number; [key: string]: unknown }) => {
            const contentStr = typeof item.content === 'string' ? item.content : String(item.content || "");
            const truncatedContent = contentStr.substring(0, 100) + (contentStr.length > 100 ? "..." : "");
            
            let dateStr = new Date().toLocaleDateString();
            if (item.createdAt) {
              try {
                const dateValue = typeof item.createdAt === 'string' || typeof item.createdAt === 'number' || item.createdAt instanceof Date 
                  ? item.createdAt 
                  : String(item.createdAt);
                dateStr = new Date(dateValue).toLocaleDateString();
              } catch {
                dateStr = new Date().toLocaleDateString();
              }
            }
            
            return {
              id: item.id?.toString() || Math.random().toString(),
              platform: (item.contentType || item.platform) as ContentType,
              content: truncatedContent,
              status: (item.posted ? "Published" : "Generated") as RecentContent["status"],
              date: dateStr,
            };
          });
          setRecentContent(formatted);
        } else {
          setRecentContent([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Generate Page] API error:", response.status, errorData);
        
        // If 401, it means authentication failed
        if (response.status === 401) {
          console.error("[Generate Page] Authentication failed - user is not signed in");
          // Don't show error toast here, just set empty content
          // The user should already see they're not signed in
        }
        
        setRecentContent([]);
      }
    } catch (error) {
      console.error("[Generate Page] Error fetching recent content:", error);
      setRecentContent([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [userId, clientIdFromQuery]);

  useEffect(() => {
    // Only fetch if userId exists (user is authenticated)
    if (userId) {
      console.log("[Generate Page] User authenticated, fetching recent content");
      fetchRecentContent();
    } else {
      console.log("[Generate Page] No userId, user not authenticated, skipping fetch");
      setRecentContent([]);
      setLoadingRecent(false);
    }
  }, [userId, fetchRecentContent]);

  // Refresh content when modal closes
  useEffect(() => {
    if (!showContentModal && userId) {
      // Small delay to ensure any database operations have completed
      const timer = setTimeout(() => {
        fetchRecentContent();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showContentModal, userId, fetchRecentContent]);

  const handleGenerate = useCallback(async () => {
    if (actionsBlocked) {
      showToast.error("Actions blocked", "Resolve payment or credits issues to generate content.");
      return;
    }
    if (!prompt.trim()) {
      showToast.error("Prompt required", "Please enter what you want to generate");
      return;
    }

    if (!userId) {
      showToast.error("Authentication required", "Please sign in to generate content");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");
    setEditedContent("");
    setShowPreview(false);

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          contentType,
          tone,
          style,
          length,
          userId,
          generationMode,
          ...(clientIdFromQuery && { clientId: clientIdFromQuery }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate content");
        showToast.error("Generation failed", errorData.details || errorData.error || "Please try again");
        return;
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setEditedContent(data.content);
      setShowContentModal(true); // Show modal when content is generated
      showToast.success("Content generated!", "Your content is ready");
      
      // Refresh recent content after a short delay to ensure DB has updated
      setTimeout(() => {
        fetchRecentContent();
      }, 500);
    } catch (error) {
      console.error("Error generating content:", error);
      setError("Failed to generate content. Please try again.");
      showToast.error("Error", "Failed to generate content. Please try again.");
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
      setLoadingMessage("");
    }
  }, [prompt, contentType, tone, style, length, generationMode, userId, fetchRecentContent, actionsBlocked, clientIdFromQuery, loadingMessages]);

  const handleCopy = useCallback(async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      showToast.success("Copied!", "Content copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [generatedContent]);

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

  const handleUseTemplate = useCallback((template: ContentTemplate) => {
    setPrompt(template.prompt);
    setContentType(template.contentType);
    if (template.tone) setTone(template.tone);
    if (template.style) setStyle(template.style);
    setShowTemplates(false);
    const templateName = template.name || "template";
    const message = "Using \"" + templateName + "\" template";
    showToast.success("Template applied!", message);
  }, []);

  const handleSchedule = useCallback(() => {
    if (!generatedContent) {
      showToast.error("No content", "Generate content first");
      return;
    }
    router.push(
      `/dashboard/schedule?content=${encodeURIComponent(generatedContent)}&platform=${contentType}${
        clientIdFromQuery ? `&clientId=${encodeURIComponent(clientIdFromQuery)}` : ""
      }`
    );
  }, [generatedContent, contentType, router]);

  const handleRegenerate = useCallback(() => {
    setShowPreview(false);
    setIsEditing(false);
    handleGenerate();
  }, [handleGenerate]);

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
      case "youtube":
        return "YouTube Description";
    }
  }, []);

  const handleExportText = useCallback(() => {
    if (generatedContent) {
      exportAsText(generatedContent, `${contentType}-content`);
      showToast.success("Exported as text file", "Your content has been downloaded");
    }
  }, [generatedContent, contentType]);

  const handleExportPDF = useCallback(async () => {
    if (generatedContent) {
      await exportAsPDF(generatedContent, getContentTypeLabel(contentType));
      showToast.success("PDF ready to print", "Use your browser's print dialog to save as PDF");
    }
  }, [generatedContent, contentType, getContentTypeLabel]);

  const previewStyles = useMemo<Record<ContentType, string>>(
    () => ({
      twitter: "bg-white text-black p-4 rounded-xl max-w-md mx-auto border border-gray-200 dark:bg-slate-100 dark:text-slate-900 dark:p-4 dark:rounded-xl dark:max-w-md dark:mx-auto",
      instagram: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white p-6 rounded-xl max-w-md mx-auto",
      linkedin: "bg-blue-50 text-gray-900 p-6 rounded-xl max-w-2xl mx-auto border border-blue-100 dark:bg-slate-700 dark:text-slate-100 dark:p-6 dark:rounded-xl dark:max-w-2xl dark:mx-auto dark:border dark:border-slate-600",
      tiktok: "bg-black text-white p-4 rounded-xl max-w-sm mx-auto",
      youtube: "bg-gradient-to-br from-red-600 to-red-800 text-white p-6 rounded-xl max-w-lg mx-auto",
    }),
    [isDark]
  );

  const renderPreview = useMemo(() => {
    if (!generatedContent) return null;
    return (
      <div className={`${previewStyles[contentType]} shadow-lg`}>
        <div className="text-sm opacity-80 mb-2 flex items-center gap-2">
          {contentType === "youtube" && <PlayIcon className="w-4 h-4" />}
          {getContentTypeLabel(contentType)} Preview
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedContent}</div>
      </div>
    );
  }, [generatedContent, contentType, previewStyles, getContentTypeLabel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isGenerating && prompt.trim() && !actionsBlocked) {
        e.preventDefault();
        handleGenerate();
      }
      if (e.key === "Escape" && showContentModal) {
        setShowContentModal(false);
        setIsEditing(false);
        setShowPreview(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e" && generatedContent && !isEditing && showContentModal) {
        e.preventDefault();
        handleEdit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && isEditing) {
        e.preventDefault();
        handleSaveEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isGenerating,
    prompt,
    showContentModal,
    generatedContent,
    isEditing,
    actionsBlocked,
    handleGenerate,
    handleEdit,
    handleSaveEdit,
  ]);

  const getPlatformLabel = (platform: ContentType): string => {
    switch (platform) {
      case "twitter": return "Twitter";
      case "instagram": return "Instagram";
      case "linkedin": return "LinkedIn";
      case "tiktok": return "TikTok";
      case "youtube": return "YouTube";
      default: return "";
    }
  };

  // Unused function - commented out
  // const getStatusColor = (status: RecentContent["status"]) => {
  //   switch (status) {
  //     case "Generated": return "bg-green-50 text-green-700 border-green-200";
  //     case "Published": return "bg-green-50 text-green-700 border-green-200";
  //     case "Scheduled": return "bg-green-50 text-green-700 border-green-200";
  //   }
  // };

  const getPlatformIconBg = (platform: ContentType): string => {
    switch (platform) {
      case "twitter": return "bg-black";
      case "instagram": return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500";
      case "linkedin": return "bg-blue-600";
      case "tiktok": return "bg-black";
      case "youtube": return "bg-red-600";
      default: return "";
    }
  };

  const getPlatformIcon = (platform: ContentType, isWhite = false) => {
    const className = isWhite ? "w-5 h-5 text-white" : "w-4 h-4";
    switch (platform) {
      case "twitter": 
        return <TwitterIcon className={className} />;
      case "instagram": 
        return <InstagramIcon className={className} />;
      case "linkedin": 
        return <LinkedinIcon className={className} />;
      case "tiktok": 
        return <MusicIcon className={className} />;
      case "youtube": 
        return <PlayIcon className={className} />;
      default: 
        return <TwitterIcon className={className} />;
    }
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
      case "youtube":
        return <PlayIcon className="w-5 h-5" />;
      default:
        return <TwitterIcon className="w-5 h-5" />;
    }
  };

  const contentTypes = useMemo(
    () => (["twitter", "instagram", "linkedin", "tiktok", "youtube"] as ContentType[]),
    []
  );
  const tones = useMemo(
    () => (["professional", "casual", "funny", "inspiring", "educational"] as Tone[]),
    []
  );
  const styles = useMemo(
    () => (["concise", "detailed", "storytelling", "list-based"] as Style[]),
    []
  );
  const lengths = useMemo(
    () => (["short", "medium", "long"] as Length[]),
    []
  );

  const containerClassName = "min-h-screen transition-colors duration-300 bg-white dark:min-h-screen dark:transition-colors dark:duration-300 dark:bg-slate-900";

  return (
    <div className={containerClassName}>
      <div className="max-w-6xl mx-auto py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 text-foreground`}>
            Generate Content
            {clientName && (
              <span className="text-foreground dark:text-purple-400 font-semibold ml-2">for {clientName}</span>
            )}
          </h1>
          <p className={`text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1`}>
            <span>Create engaging content for your social media platforms</span>
            {clientIdFromQuery && (
              <>
                <span className={"text-muted-foreground/70"}>·</span>
                {brandVoice ? (
                  <span className={"text-teal-700 dark:text-teal-300"}>
                    Brand voice on
                    {brandVoice.brandDescription
                      ? ` · ${brandVoice.brandDescription.slice(0, 48)}${
                          brandVoice.brandDescription.length > 48 ? "…" : ""
                        }`
                      : ""}
                  </span>
                ) : (
                  <Link
                    href={`/dashboard/clients/${clientIdFromQuery}/brand-voice`}
                    className="text-foreground hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Add brand voice
                  </Link>
                )}
              </>
            )}
          </p>
        </div>

        <AlertBanner items={alertBanners} blockActions={actionsBlocked} className="mb-4" />

        {/* Main Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Generation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Platform Selection */}
              <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
                <CardContent className="p-4 sm:p-6">
                  <label className={`block text-sm font-semibold mb-3 text-foreground`}>Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {contentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-[0.5px] transition-all duration-200 ${
                          contentType === type
                            ? "border-foreground/30 bg-muted text-foreground dark:border-foreground/40 dark:bg-accent dark:text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:border-border dark:bg-muted/30 dark:text-muted-foreground dark:hover:bg-accent/50 dark:hover:text-foreground"
                        }`}
                      >
                        {getContentTypeIcon(type)}
                        <span className="text-xs font-medium capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prompt Input */}
              <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
                <CardContent className="p-4 sm:p-6">
                  <Label className="mb-3 block">What do you want to create?</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to post about... (e.g., 'A post about launching our new product')"
                    rows={4}
                  />
                  <div className={`mt-2 text-xs text-right text-muted-foreground`}>
                    {prompt.length} characters
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button - Sticky on scroll */}
              <div className="sticky top-4 z-10">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || actionsBlocked}
                  className="w-full py-4 sm:py-6 text-base font-medium"
                >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    {loadingMessage || "Generating…"}
                  </>
                ) : (
                  "Generate Content"
                )}
                </Button>
              </div>

              {/* Options (collapsible) */}
              <Card className={`border rounded-xl transition-colors duration-300 bg-card border-border`}>
                <CardContent className="p-4 sm:p-6">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center justify-between w-full"
                  >
                    <label className={`block text-sm font-semibold text-foreground`}>
                      Options
                    </label>
                    <span className={`text-xs transition-colors duration-200 ${"text-gray-600 hover:text-gray-950 dark:text-slate-400 dark:hover:text-white"}`}>
                      {showOptions ? "Hide" : "Show"}
                    </span>
                  </button>

                  {showOptions && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-5">
                      {/* Brand Voice (when client) */}
                      {clientIdFromQuery && (
                        <div>
                          <label className={`block text-xs font-medium mb-2 text-foreground/80`}>
                            Brand Voice
                          </label>
                          <p className={`text-xs mb-1 text-muted-foreground`}>
                            {brandVoice ? (
                              brandVoice.brandDescription
                                ? `${brandVoice.brandDescription.slice(0, 100)}${brandVoice.brandDescription.length > 100 ? "…" : ""}`
                                : "Using brand voice settings"
                            ) : (
                              "No brand description set"
                            )}
                          </p>
                          <Link
                            href={`/dashboard/clients/${clientIdFromQuery}/brand-voice`}
                            className="text-xs text-foreground hover:text-purple-500 dark:text-purple-400"
                          >
                            {brandVoice ? "Edit brand voice" : "Add brand voice"}
                          </Link>
                        </div>
                      )}

                      {/* Generation Mode */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 text-foreground/80`}>
                          Generation Mode
                        </label>
                        <select
                          value={generationMode}
                          onChange={(e) => setGenerationMode(e.target.value as GenerationMode)}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            "bg-white border-gray-200 text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          }`}
                        >
                          {(Object.entries(GENERATION_MODE_LABELS) as [GenerationMode, string][]).map(([mode, label]) => (
                            <option key={mode} value={mode}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Templates */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`block text-xs font-medium text-foreground/80`}>
                            Templates
                          </label>
                          <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={`text-xs ${"text-gray-600 hover:text-gray-950 dark:text-slate-400 dark:hover:text-white"}`}
                          >
                            {showTemplates ? "Hide" : "Show"}
                          </button>
                        </div>
                        {showTemplates && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {contentTemplates
                              .filter((t) => t.contentType === contentType)
                              .map((template) => (
                                <button
                                  key={template.id}
                                  onClick={() => handleUseTemplate(template)}
                                  className={`text-left p-2.5 rounded-lg border text-sm ${
                                    "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:bg-slate-700/50 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <div className={`font-medium text-foreground`}>{template.name}</div>
                                  <div className={`text-xs truncate text-muted-foreground`}>{template.description}</div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Tone */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 text-foreground/80`}>Tone</label>
                        <div className="flex flex-wrap gap-2">
                          {tones.map((t) => (
                            <button
                              key={t}
                              onClick={() => setTone(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tone === t ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 text-foreground/80`}>Style</label>
                        <div className="flex flex-wrap gap-2">
                          {styles.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStyle(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${style === s ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Length */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 text-foreground/80`}>Length</label>
                        <div className="flex flex-wrap gap-2">
                          {lengths.map((l) => (
                            <button
                              key={l}
                              onClick={() => setLength(l)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                length === l ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            {/* Generated Content - Now shown in modal, keeping this for reference if needed */}

              {/* Error Message */}
              {error && (
                <Card className={`border rounded-xl transition-colors duration-300 ${"bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
                  <CardContent className="p-4">
                    <p className={`text-sm ${"text-red-700 dark:text-red-300"}`}>{error}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Recent Content */}
            <div className="space-y-6">
              <Card className={`border rounded-xl shadow-md transition-colors duration-300 bg-card border-border`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-lg font-bold text-foreground`}>Recent Content</h2>
                    <button
                      onClick={() => fetchRecentContent()}
                      disabled={loadingRecent}
                      className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${"hover:bg-gray-100 text-gray-600 dark:hover:bg-slate-700 dark:text-slate-300"}`}
                      title="Refresh"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {loadingRecent ? (
                    <div className="text-center py-8">
                      <Loader2Icon className={`w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground`} />
                      <p className={`text-xs text-muted-foreground`}>Loading...</p>
                    </div>
                  ) : recentContent.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {recentContent.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 transition-all cursor-pointer group ${"bg-white border-gray-200 hover:border-gray-300 dark:bg-slate-700/50 dark:border-slate-600 dark:hover:border-slate-500"}`}
                          onClick={() => {
                            setGeneratedContent(item.content);
                            setEditedContent(item.content);
                            setContentType(item.platform);
                            setShowContentModal(true);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Platform Icon - Colored Square */}
                            <div className={`${getPlatformIconBg(item.platform)} w-10 h-10 rounded flex items-center justify-center flex-shrink-0`}>
                              {getPlatformIcon(item.platform, true)}
                            </div>
                            
                            {/* Content and Info */}
                            <div className="flex-1 min-w-0">
                              {/* Platform Name and Status */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold text-foreground`}>
                                    {getPlatformLabel(item.platform)}
                                  </span>
                                  <div className="w-4 h-4 text-blue-500">
                                    {getPlatformIcon(item.platform)}
                                  </div>
                                </div>
                                {/* Status Badge */}
                                <Badge className={`text-xs px-2.5 py-1 font-medium rounded-full ${"bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border dark:border-green-800"}`}>
                                  {item.status}
                                </Badge>
                              </div>
                              
                              {/* Content Text */}
                              <p className={`text-sm mb-1.5 leading-relaxed line-clamp-2 text-foreground`}>
                                {item.content}
                              </p>
                              
                              {/* Secondary Status Text */}
                              <p className={`text-xs text-muted-foreground`}>
                                In. {getPlatformLabel(item.platform)} {item.status === "Published" ? "Published" : item.status === "Scheduled" ? "Scheduled" : "Generated"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileTextIcon className={`w-8 h-8 mx-auto mb-2 text-muted-foreground/70`} />
                      <p className={`text-sm text-muted-foreground`}>No recent content</p>
                      <p className={`text-xs mt-1 text-muted-foreground`}>Generate content to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Generation loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`rounded-2xl shadow-xl max-w-md w-full p-8 text-center border transition-colors duration-300 bg-card border-border`}
          >
            <Loader2Icon
              className={`w-12 h-12 animate-spin mx-auto mb-4 ${
                "text-foreground dark:text-purple-400"
              }`}
            />
            <h3 className={`text-lg font-semibold mb-2 text-foreground`}>
              {loadingMessage || "Generating…"}
            </h3>
            <p className={`text-sm text-muted-foreground`}>
              This usually takes a few seconds
            </p>
          </div>
        </div>
      )}

      {/* Generated Content Modal */}
      {showContentModal && generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowContentModal(false)}>
          <div className={`rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col transition-colors duration-300 ${"bg-white dark:bg-slate-800 dark:border dark:border-slate-700"}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 border-border`}>
              <h3 className={`text-lg font-bold text-foreground`}>Generated Content</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className={`p-2 rounded-lg transition-all duration-200 ${"hover:bg-gray-100 text-gray-600 dark:hover:bg-slate-700 dark:text-slate-300"}`}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <div className="space-y-3">
                  <p
                    className={`text-xs rounded-lg px-3 py-2 ${
                      "bg-muted text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                    }`}
                  >
                    Press Ctrl/Cmd + S to save, Esc to cancel
                  </p>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:border-ring ${
                      "bg-white border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                    }`}
                    rows={12}
                  />
                </div>
              ) : (
                <>
                  {showPreview && (
                    <div className="mb-4">{renderPreview}</div>
                  )}
                  <div className={`border rounded-xl p-6 transition-colors duration-300 ${
                    "bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-slate-700"
                  }`}>
                    <pre className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground`}>
                      {generatedContent}
                    </pre>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-t gap-3 transition-colors duration-300 border-border`}>
              <div className="flex flex-wrap items-center gap-2">
                {!isEditing && (
                  <>
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <CopyIcon className="w-4 h-4 mr-1" />
                      {isCopied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      onClick={() => setShowPreview(!showPreview)}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {showPreview ? "Hide Preview" : "Preview"}
                    </Button>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleExportText}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <DownloadIcon className="w-4 h-4 mr-1" />
                      Export TXT
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <FileTextIcon className="w-4 h-4 mr-1" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={handleRegenerate}
                      size="sm"
                      variant="outline"
                      disabled={isGenerating}
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      <RefreshCwIcon className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={handleSchedule}
                      size="sm"
                      className={`rounded-lg transition-all duration-200 ${
                        "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
                      }`}
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      onClick={() => {
                        setShowContentModal(false);
                        router.push("/dashboard/history");
                      }}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      History
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      size="sm"
                      className={`rounded-lg transition-all duration-200 ${
                        "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white dark:bg-primary dark:hover:bg-primary/90 dark:active:bg-purple-800 dark:text-primary-foreground"
                      }`}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                      }`}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <Button
                onClick={() => {
                  setShowContentModal(false);
                  setShowPreview(false);
                  setIsEditing(false);
                }}
                variant="outline"
                className={`rounded-lg transition-all duration-200 ${
                  "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500 dark:hover:text-white"
                }`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <KeyboardShortcuts />
    </div>
  );
}

export default function DashboardGeneratePage() {
  return (
    <Suspense fallback={
      <LoadingScreen variant="inline" message="Loading generator..." />
    }>
      <DashboardGeneratePageInner />
    </Suspense>
  );
}
