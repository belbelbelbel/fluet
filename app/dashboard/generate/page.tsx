"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/lib/toast";
import { contentTemplates, ContentTemplate } from "@/lib/templates";
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  MusicIcon,
  PlayIcon,
  SearchIcon,
  BellIcon,
  SettingsIcon,
  CalendarIcon,
  CopyIcon,
  EditIcon,
  FileTextIcon,
  Loader2Icon,
  X as XIcon,
  RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";

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
  const { user } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchRecentContent = useCallback(async () => {
    if (!userId) {
      setRecentContent([]);
      return;
    }
    try {
      setLoadingRecent(true);
      const response = await fetch(`/api/content?limit=5${userId ? `&userId=${userId}` : ''}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const formatted = data.slice(0, 5).map((item: { id?: string | number; [key: string]: unknown }) => ({
            id: item.id?.toString() || Math.random().toString(),
            platform: (item.contentType || item.platform) as ContentType,
            content: (() => {
              const contentStr = typeof item.content === 'string' ? item.content : String(item.content || "");
              return contentStr.substring(0, 100) + (contentStr.length > 100 ? "..." : "");
            })(),
            status: (item.posted ? "Published" : "Generated") as RecentContent["status"],
            date: (() => {
              if (!item.createdAt) return new Date().toLocaleDateString();
              const dateValue = typeof item.createdAt === 'string' || typeof item.createdAt === 'number' || item.createdAt instanceof Date 
                ? item.createdAt 
                : String(item.createdAt);
              try {
                return new Date(dateValue).toLocaleDateString();
              } catch {
                return new Date().toLocaleDateString();
              }
            })(),
          }));
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
  }, [prompt, contentType, tone, style, length, userId, fetchRecentContent]);

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
    showToast.success("Template applied!", `Using "${template.name}" template`);
  }, []);

  const handleSchedule = useCallback(() => {
    if (!generatedContent) {
      showToast.error("No content", "Generate content first");
      return;
    }
    router.push(`/dashboard/schedule?content=${encodeURIComponent(generatedContent)}&platform=${contentType}`);
  }, [generatedContent, contentType, router]);

  const getPlatformLabel = (platform: ContentType) => {
    switch (platform) {
      case "twitter": return "Twitter";
      case "instagram": return "Instagram";
      case "linkedin": return "LinkedIn";
      case "tiktok": return "TikTok";
      case "youtube": return "YouTube";
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

  const getPlatformIconBg = (platform: ContentType) => {
    switch (platform) {
      case "twitter": return "bg-black";
      case "instagram": return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500";
      case "linkedin": return "bg-blue-600";
      case "tiktok": return "bg-black";
      case "youtube": return "bg-red-600";
    }
  };

  const getPlatformIcon = (platform: ContentType, isWhite = false) => {
    const className = isWhite ? "w-5 h-5 text-white" : "w-4 h-4";
    switch (platform) {
      case "twitter": return <TwitterIcon className={className} />;
      case "instagram": return <InstagramIcon className={className} />;
      case "linkedin": return <LinkedinIcon className={className} />;
      case "tiktok": return <MusicIcon className={className} />;
      case "youtube": return <PlayIcon className={className} />;
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case "twitter": return <TwitterIcon className="w-5 h-5" />;
      case "instagram": return <InstagramIcon className="w-5 h-5" />;
      case "linkedin": return <LinkedinIcon className="w-5 h-5" />;
      case "tiktok": return <MusicIcon className="w-5 h-5" />;
      case "youtube": return <PlayIcon className="w-5 h-5" />;
    }
  };

  const contentTypes = useMemo(() => (["twitter", "instagram", "linkedin", "tiktok", "youtube"] as ContentType[]), []);
  const tones = useMemo(() => (["professional", "casual", "funny", "inspiring", "educational"] as Tone[]), []);
  const styles = useMemo(() => (["concise", "detailed", "storytelling", "list-based"] as Style[]), []);
  const lengths = useMemo(() => (["short", "medium", "long"] as Length[]), []);

  return (
    <div className="h-full flex flex-col bg-white max-w-6xl mx-auto">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/dashboard/settings">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <SettingsIcon className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || "U"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-8 pb-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Generation Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Selection */}
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <label className="block text-sm font-semibold text-gray-950 mb-3">Platform</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {contentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setContentType(type)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                contentType === type
                          ? "border-blue-600 bg-blue-50 text-blue-900"
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
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-950">Templates</label>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
                    className="text-xs text-gray-600 hover:text-gray-950"
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
                          className="text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                          <div className="text-sm font-semibold text-gray-950 mb-1">{template.name}</div>
                          <div className="text-xs text-gray-600">{template.description}</div>
                  </button>
                ))}
          </div>
        )}
              </CardContent>
            </Card>

            {/* Prompt Input */}
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <label className="block text-sm font-semibold text-gray-950 mb-3">
                  What do you want to create?
                </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to post about... (e.g., 'A post about launching our new product')"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          rows={4}
        />
                <div className="mt-2 text-xs text-gray-500 text-right">
                  {prompt.length} characters
        </div>
              </CardContent>
            </Card>

      {/* Customization Options */}
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardContent className="p-6">
        <button
          onClick={() => setShowCustomization(!showCustomization)}
                  className="flex items-center justify-between w-full mb-4"
        >
                  <label className="block text-sm font-semibold text-gray-950">Customization</label>
                  <span className="text-xs text-gray-600">{showCustomization ? "Hide" : "Show"} Options</span>
        </button>

        {showCustomization && (
                  <div className="space-y-4">
                    {/* Tone */}
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Tone</label>
                      <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      tone === t
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

                    {/* Style */}
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Style</label>
                      <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      style === s
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

                    {/* Length */}
            <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Length</label>
                      <div className="flex flex-wrap gap-2">
                {lengths.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      length === l
                                ? "bg-purple-600 text-white"
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
          disabled={isGenerating || !prompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
              <Card className="bg-red-50 border border-red-200 rounded-xl">
                <CardContent className="p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recent Content */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-950">Recent Content</h2>
                  <button
                    onClick={() => fetchRecentContent()}
                    disabled={loadingRecent}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCwIcon className={`w-4 h-4 text-gray-600 ${loadingRecent ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {loadingRecent ? (
                  <div className="text-center py-8">
                    <Loader2Icon className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Loading...</p>
                  </div>
                ) : recentContent.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {recentContent.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all cursor-pointer group"
                        onClick={() => {
                          setGeneratedContent(item.content);
                          setEditedContent(item.content);
                          setContentType(item.platform);
                          setShowContentModal(true);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Platform Icon - Colored Square (like reference) */}
                          <div className={`${getPlatformIconBg(item.platform)} w-10 h-10 rounded flex items-center justify-center flex-shrink-0`}>
                            {getPlatformIcon(item.platform, true)}
                          </div>
                          
                          {/* Content and Info */}
                          <div className="flex-1 min-w-0">
                            {/* Platform Name and Status */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-950">
                                  {getPlatformLabel(item.platform)}
                                </span>
                                {/* Small platform icon next to platform name (like reference) */}
                                <div className="w-4 h-4 text-blue-500">
                                  {getPlatformIcon(item.platform)}
                                </div>
                              </div>
                              {/* Status Badge - Green Pill (like reference) */}
                              <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 font-medium rounded-full">
                                {item.status}
                              </Badge>
                            </div>
                            
                            {/* Content Text */}
                            <p className="text-sm text-gray-950 mb-1.5 leading-relaxed line-clamp-2">
                              {item.content}
                            </p>
                            
                            {/* Secondary Status Text (like reference: "In. Twitter Generated") */}
                            <p className="text-xs text-gray-500">
                              In. {getPlatformLabel(item.platform)} {item.status === "Published" ? "Published" : item.status === "Scheduled" ? "Scheduled" : "Generated"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No recent content</p>
                    <p className="text-xs text-gray-500 mt-1">Generate content to see it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Generated Content Modal */}
      {showContentModal && generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowContentModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-950">Generated Content</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
                  rows={12}
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 gap-3">
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <CopyIcon className="w-4 h-4 mr-1" />
                      {isCopied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleSchedule}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
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
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              <Button
                onClick={() => setShowContentModal(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
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
