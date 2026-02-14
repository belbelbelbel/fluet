"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertBanner, type AlertBannerItem } from "@/components/AlertBanner";
import { showToast } from "@/lib/toast";
import { contentTemplates, ContentTemplate } from "@/lib/templates";
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

export default function DashboardGeneratePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Generation form state
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
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  // const [loadingMessage, setLoadingMessage] = useState("");
  const [showContentModal, setShowContentModal] = useState(false);

  // Removed loading messages - just use "Generating..." text

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
      const url = `/api/content?limit=5${userId ? '&userId=' + userId : ''}`;
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
  }, [userId]);

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
    // setLoadingMessage("Generating..."); // Unused - commented out

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
      setIsGenerating(false);
      // setLoadingMessage(""); // Unused - commented out
    }
  }, [prompt, contentType, tone, style, length, userId, fetchRecentContent, actionsBlocked]);

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
    router.push(`/dashboard/schedule?content=${encodeURIComponent(generatedContent)}&platform=${contentType}`);
  }, [generatedContent, contentType, router]);

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

  const containerClassName = isDark 
    ? "min-h-screen transition-colors duration-300 bg-slate-900"
    : "min-h-screen transition-colors duration-300 bg-white";

  return (
    <div className={containerClassName}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-950"}`}>
            Generate Content
          </h1>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Create engaging content for your social media platforms
          </p>
        </div>

        <AlertBanner items={alertBanners} blockActions={actionsBlocked} className="mb-4" />

        {/* Main Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Generation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Platform Selection */}
              <Card className={`border rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <CardContent className="p-4 sm:p-6">
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-gray-950"}`}>Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {contentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                          contentType === type
                            ? isDark
                              ? "border-purple-500 bg-purple-900/50 text-purple-300"
                              : "border-purple-600 bg-purple-50 text-purple-900"
                            : isDark
                            ? "border-slate-700 bg-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {getContentTypeIcon(type)}
                        <span className="text-xs font-medium capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Templates */}
              <Card className={`border rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className={`block text-sm font-semibold ${isDark ? "text-white" : "text-gray-950"}`}>Templates</label>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={`text-xs transition-colors duration-200 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-gray-950"}`}
                    >
                      {showTemplates ? "Hide" : "Show"} Templates
                    </button>
                  </div>
                  {showTemplates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {contentTemplates
                        .filter((t) => t.contentType === contentType)
                        .map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleUseTemplate(template)}
                            className={`text-left p-3 rounded-lg border transition-all duration-200 ${isDark ? "border-slate-700 bg-slate-700/50 hover:border-slate-600 hover:bg-slate-700" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                          >
                            <div className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-gray-950"}`}>{template.name}</div>
                            <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>{template.description}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prompt Input */}
              <Card className={`border rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <CardContent className="p-4 sm:p-6">
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-gray-950"}`}>
                    What do you want to create?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to post about... (e.g., 'A post about launching our new product')"
                    className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 hover:border-slate-500"
                        : "bg-white border-gray-200 text-gray-950 placeholder-gray-400 hover:border-gray-300"
                    }`}
                    rows={4}
                  />
                  <div className={`mt-2 text-xs text-right ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}>
                    {prompt.length} characters
                  </div>
                </CardContent>
              </Card>

              {/* Customization Options */}
              <Card className={`border rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <CardContent className="p-4 sm:p-6">
                  <button
                    onClick={() => setShowCustomization(!showCustomization)}
                    className="flex items-center justify-between w-full mb-4"
                  >
                    <label className={`block text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-950"
                    }`}>Customization</label>
                    <span className={`text-xs transition-colors duration-200 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-gray-950"}`}>{showCustomization ? "Hide" : "Show"} Options</span>
                  </button>

                  {showCustomization && (
                    <div className="space-y-4">
                      {/* Tone */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>Tone</label>
                        <div className="flex flex-wrap gap-2">
                          {tones.map((t) => (
                            <button
                              key={t}
                              onClick={() => setTone(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${tone === t ? "bg-purple-600 text-white" : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Style */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>Style</label>
                        <div className="flex flex-wrap gap-2">
                          {styles.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStyle(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${style === s ? "bg-purple-600 text-white" : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Length */}
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${
                          isDark ? "text-slate-300" : "text-gray-700"
                        }`}>Length</label>
                        <div className="flex flex-wrap gap-2">
                          {lengths.map((l) => (
                            <button
                              key={l}
                              onClick={() => setLength(l)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                length === l
                                  ? "bg-purple-600 text-white"
                                  : isDark
                                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || actionsBlocked}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl py-4 sm:py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>

            {/* Generated Content - Now shown in modal, keeping this for reference if needed */}

              {/* Error Message */}
              {error && (
                <Card className={`border rounded-xl transition-colors duration-300 ${isDark ? "bg-red-950/30 border-red-800" : "bg-red-50 border-red-200"}`}>
                  <CardContent className="p-4">
                    <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Recent Content */}
            <div className="space-y-6">
              <Card className={`border rounded-xl shadow-md transition-colors duration-300 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-950"}`}>Recent Content</h2>
                    <button
                      onClick={() => fetchRecentContent()}
                      disabled={loadingRecent}
                      className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${isDark ? "hover:bg-slate-700 text-slate-300" : "hover:bg-gray-100 text-gray-600"}`}
                      title="Refresh"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {loadingRecent ? (
                    <div className="text-center py-8">
                      <Loader2Icon className={`w-6 h-6 animate-spin mx-auto mb-2 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>Loading...</p>
                    </div>
                  ) : recentContent.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {recentContent.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 transition-all cursor-pointer group ${isDark ? "bg-slate-700/50 border-slate-600 hover:border-slate-500" : "bg-white border-gray-200 hover:border-gray-300"}`}
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
                                  <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-950"}`}>
                                    {getPlatformLabel(item.platform)}
                                  </span>
                                  <div className="w-4 h-4 text-blue-500">
                                    {getPlatformIcon(item.platform)}
                                  </div>
                                </div>
                                {/* Status Badge */}
                                <Badge className={`text-xs px-2.5 py-1 font-medium rounded-full ${isDark ? "bg-green-950/50 text-green-400 border border-green-800" : "bg-green-50 text-green-700 border border-green-200"}`}>
                                  {item.status}
                                </Badge>
                              </div>
                              
                              {/* Content Text */}
                              <p className={`text-sm mb-1.5 leading-relaxed line-clamp-2 ${isDark ? "text-slate-200" : "text-gray-950"}`}>
                                {item.content}
                              </p>
                              
                              {/* Secondary Status Text */}
                              <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                                In. {getPlatformLabel(item.platform)} {item.status === "Published" ? "Published" : item.status === "Scheduled" ? "Scheduled" : "Generated"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileTextIcon className={`w-8 h-8 mx-auto mb-2 ${
                        isDark ? "text-slate-500" : "text-gray-400"
                      }`} />
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>No recent content</p>
                      <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-500"}`}>Generate content to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Content Modal */}
      {showContentModal && generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowContentModal(false)}>
          <div className={`rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col transition-colors duration-300 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${isDark ? "border-slate-700" : "border-gray-200"}`}>
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-950"}`}>Generated Content</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className={`p-2 rounded-lg transition-all duration-200 ${isDark ? "hover:bg-slate-700 text-slate-300" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  }`}
                  rows={12}
                />
              ) : (
                <div className={`border rounded-xl p-6 transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-900/50 border-slate-700"
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${
                    isDark ? "text-slate-200" : "text-gray-900"
                  }`}>
                    {generatedContent}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between p-6 border-t gap-3 transition-colors duration-300 ${
              isDark ? "border-slate-700" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <CopyIcon className="w-4 h-4 mr-1" />
                      {isCopied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleSchedule}
                      size="sm"
                      className={`rounded-lg transition-all duration-200 ${
                        isDark
                          ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                          : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
                      }`}
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Schedule
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      size="sm"
                      className={`rounded-lg transition-all duration-200 ${
                        isDark
                          ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white"
                          : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white"
                      }`}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className={`rounded-lg transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <Button
                onClick={() => setShowContentModal(false)}
                variant="outline"
                className={`rounded-lg transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
