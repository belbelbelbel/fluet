"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Brain,
  Check,
  Save,
  Loader2,
  ChevronDown,
  PlayIcon,
  LinkIcon,
  Cpu,
  Code,
  Twitter,
  Instagram,
  Calendar,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { Niche } from "@/lib/content-ideas";
import {
  UtensilsCrossed,
  ShoppingBag,
  Cake,
  Shirt,
  Scissors,
  Briefcase,
  Store,
} from "lucide-react";

type AIModel = "gpt-4o-mini" | "gpt-4" | "claude-3-haiku" | "claude-3-sonnet" | "gemini-pro";

const niches = [
  {
    id: "home_food_vendor" as Niche,
    name: "Home Food Vendor",
    icon: UtensilsCrossed,
    emoji: "🍲"
  },
  {
    id: "street_food_seller" as Niche,
    name: "Street Food Seller",
    icon: ShoppingBag,
    emoji: "🍔"
  },
  {
    id: "baker_cake_vendor" as Niche,
    name: "Baker / Cake Vendor",
    icon: Cake,
    emoji: "🎂"
  },
  {
    id: "fashion_seller" as Niche,
    name: "Fashion Seller",
    icon: Shirt,
    emoji: "👗"
  },
  {
    id: "beauty_hair_vendor" as Niche,
    name: "Beauty / Hair Vendor",
    icon: Scissors,
    emoji: "💇🏽"
  },
  {
    id: "business_coach" as Niche,
    name: "Business / Coach",
    icon: Briefcase,
    emoji: "💼"
  },
  {
    id: "online_vendor" as Niche,
    name: "Online Vendor (IG Shop)",
    icon: Store,
    emoji: "📱"
  },
];

interface AIModelInfo {
  id: AIModel;
  name: string;
  provider: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  quality: "high" | "medium" | "low";
  cost: "low" | "medium" | "high";
  icon: React.ReactNode;
  color: string;
}

const aiModels: AIModelInfo[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and efficient, perfect for quick content generation",
    speed: "fast",
    quality: "high",
    cost: "low",
    icon: <Bot className="w-4 h-4" />,
    color: "text-green-600",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most advanced model with superior quality and creativity",
    speed: "medium",
    quality: "high",
    cost: "high",
    icon: <Brain className="w-4 h-4" />,
    color: "text-blue-600",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Lightning-fast responses with good quality",
    speed: "fast",
    quality: "medium",
    cost: "low",
    icon: <Cpu className="w-4 h-4" />,
    color: "text-purple-600",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance with excellent reasoning",
    speed: "medium",
    quality: "high",
    cost: "medium",
    icon: <Bot className="w-4 h-4" />,
    color: "text-indigo-600",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Great for diverse content types and multilingual support",
    speed: "fast",
    quality: "high",
    cost: "medium",
    icon: <Code className="w-4 h-4" />,
    color: "text-orange-600",
  },
];

interface UserSettings {
  defaultAIModel: AIModel;
  autoSave: boolean;
  notifications: boolean;
  theme: "dark" | "light" | "system";
  niche?: Niche;
  youtubeConnected?: boolean;
  twitterConnected?: boolean;
  instagramConnected?: boolean;
  googleCalendarConnected?: boolean;
  emailApprovals?: boolean;
  emailTasks?: boolean;
  defaultRequiresApproval?: boolean;
}

export default function SettingsPage() {
  const { userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { theme: currentTheme, setTheme: setCurrentTheme, resolvedTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    defaultAIModel: "gpt-4o-mini",
    emailApprovals: true,
    emailTasks: true,
    defaultRequiresApproval: true,
    autoSave: true,
    notifications: true,
    theme: currentTheme,
    niche: (localStorage.getItem("userNiche") as Niche) || undefined,
    youtubeConnected: false, // Will be checked from database/API
    twitterConnected: false, // Will be checked from database/API
    instagramConnected: false, // Will be checked from database/API
    googleCalendarConnected: false, // Will be checked from database/API
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const checkYouTubeConnection = async () => {
    try {
      const response = await fetch(`/api/youtube/status${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, youtubeConnected: data.connected }));
      }
    } catch (error) {
      console.error("Error checking YouTube connection:", error);
    }
  };

  const checkTwitterConnection = async () => {
    try {
      const response = await fetch(`/api/twitter/status${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, twitterConnected: data.connected }));
      }
    } catch (error) {
      console.error("Error checking Twitter connection:", error);
    }
  };

  const checkInstagramConnection = async () => {
    try {
      const response = await fetch(`/api/instagram/status${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, instagramConnected: data.connected }));
      }
    } catch (error) {
      console.error("Error checking Instagram connection:", error);
    }
  };

  const checkGoogleCalendarConnection = async () => {
    try {
      const response = await fetch(`/api/google-calendar/status${userId ? `?userId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, googleCalendarConnected: data.connected }));
      }
    } catch (error) {
      console.error("Error checking Google Calendar connection:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/settings?userId=${userId || ''}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...data, theme: currentTheme });
        // Apply theme if it's different
        if (data.theme && data.theme !== currentTheme) {
          setCurrentTheme(data.theme);
        }
      } else if (response.status === 401) {
        // Authentication failed - use defaults
        setSettings(prev => ({ ...prev, theme: currentTheme }));
      } else {
        // Use current theme from context
        setSettings(prev => ({ ...prev, theme: currentTheme }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use current theme from context
      setSettings(prev => ({ ...prev, theme: currentTheme }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSettings();
      checkYouTubeConnection();
      checkTwitterConnection();
      checkInstagramConnection();
      checkGoogleCalendarConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Check connections when component mounts or URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("youtube") === "connected") {
      checkYouTubeConnection();
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings");
    }
    if (urlParams.get("success") === "google_calendar_connected") {
      checkGoogleCalendarConnection();
      showToast.success("Google Calendar connected", "You'll now receive calendar reminders for manual posts");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  const saveSettings = async () => {
    if (!userId) {
      showToast.error("Authentication required", "Please sign in to save settings");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, settings }),
      });

      if (response.ok) {
        showToast.success("Settings saved", "Your preferences have been updated");
      } else if (response.status === 401) {
        showToast.error("Authentication failed", "Please sign in again");
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast.error("Failed to save", errorData.error || "Please try again");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast.error("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userLoaded) {
    const isDarkLoading = resolvedTheme === "dark";
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDarkLoading ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-28 h-28 rounded-full animate-pulse ${
                  isDarkLoading ? "bg-purple-500/20" : "bg-purple-100"
                }`}></div>
              </div>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Logo size="lg" variant="icon" />
              </div>
            </div>
            <div className="flex space-x-2 justify-center mt-4">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            isDarkLoading ? "text-white" : "text-gray-950"
          }`}>
            Loading Settings...
          </h2>
          <p className={isDarkLoading ? "text-slate-400" : "text-gray-600"}>
            Please wait while we load your settings
          </p>
        </div>
      </div>
    );
  }

  // Calculate isDark after loading check to ensure resolvedTheme is available
  const isDark = resolvedTheme ? (currentTheme === "dark" || (currentTheme === "system" && resolvedTheme === "dark")) : false;

  return (
    <div className={`space-y-6 pt-6 max-w-4xl mx-auto px-4 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    } min-h-screen`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${
          isDark ? "text-white" : "text-gray-950"
        }`}>Settings</h1>
        <p className={`text-sm ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}>Manage your preferences and AI model selection</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <div className={`border-b transition-colors duration-300 ${
          isDark ? "border-slate-700" : "border-gray-200"
        }`}>
          <TabsList className={`bg-transparent h-auto p-0 w-full sm:w-auto justify-start gap-0 flex-wrap border-b transition-colors duration-300 ${
            isDark ? "border-slate-700" : "border-gray-200"
          }`}>
            <TabsTrigger value="agency" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <Bot className="w-4 h-4 mr-2" />
              Agency Profile
            </TabsTrigger>
            <TabsTrigger value="integrations" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="team" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <Check className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <Calendar className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ai" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <Brain className="w-4 h-4 mr-2" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="workflow" className={`px-4 py-2 text-sm font-medium border-b-2 border-transparent rounded-none transition-all duration-200 ${
              isDark
                ? "data-[state=active]:text-purple-400 data-[state=active]:border-purple-600 text-slate-400 hover:text-slate-300"
                : "data-[state=active]:text-gray-950 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 text-gray-600 hover:text-gray-950"
            }`}>
              <Cpu className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Models Tab */}
        {/* Agency Profile Tab */}
        <TabsContent value="agency" className="space-y-6">
          <Card className={`${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          } rounded-xl shadow-sm`}>
            <CardHeader className={`border-b ${
              isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <CardTitle className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Agency Information</CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                Manage your agency profile and contact details
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-6">
        <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  Agency Name
                </label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-slate-200"
                      : "border-gray-300 bg-gray-50 text-gray-600"
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}>
                  Agency name is managed through your account profile
          </p>
        </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-slate-200"
                      : "border-gray-300 bg-gray-50 text-gray-600"
                  }`}
                />
              </div>
              <div className={`pt-4 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}>
                <h3 className={`text-sm font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>Quick Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-purple-950/50 border-purple-900"
                      : "bg-purple-50 border-purple-200"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      isDark ? "text-purple-300" : "text-purple-900"
                    }`}>0</div>
                    <div className={`text-sm ${
                      isDark ? "text-purple-400" : "text-purple-700"
                    }`}>Active Clients</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-blue-950/50 border-blue-900"
                      : "bg-blue-50 border-blue-200"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      isDark ? "text-blue-300" : "text-blue-900"
                    }`}>0</div>
                    <div className={`text-sm ${
                      isDark ? "text-blue-400" : "text-blue-700"
                    }`}>Team Members</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-green-950/50 border-green-900"
                      : "bg-green-50 border-green-200"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      isDark ? "text-green-300" : "text-green-900"
                    }`}>0</div>
                    <div className={`text-sm ${
                      isDark ? "text-green-400" : "text-green-700"
                    }`}>Posts This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900">Social Media Integrations</CardTitle>
              <CardDescription className="text-gray-600">
                Connect your social media accounts for automated posting
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-6">
              {/* YouTube Integration */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-950"
                    }`}>YouTube</h3>
                    <p className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}>Automated video uploads</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm break-words ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}>
                          {settings.youtubeConnected 
                            ? "✅ Connected - Ready for automated uploads"
                            : "Not connected - Click to connect your YouTube account"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {settings.youtubeConnected && (
        <Button
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/youtube/disconnect", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                credentials: "include",
                                body: JSON.stringify({ userId }),
                              });

                              if (response.ok) {
                                setSettings(prev => ({ ...prev, youtubeConnected: false }));
                                await checkYouTubeConnection();
                                showToast.success("YouTube disconnected", "Your YouTube account has been disconnected");
                              } else {
                                const data = await response.json();
                                throw new Error(data.error || "Failed to disconnect");
                              }
                            } catch (error: unknown) {
                              console.error("Disconnect error:", error);
                              showToast.error("Disconnect failed", error instanceof Error ? error.message : "Failed to disconnect YouTube");
                            }
                          }}
                          className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          window.location.href = "/api/youtube/auth";
                        }}
                        className={`w-full sm:w-auto flex-shrink-0 ${
                          settings.youtubeConnected
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {settings.youtubeConnected ? (
                          <>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Reconnect
            </>
          ) : (
            <>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Connect YouTube
            </>
          )}
        </Button>
      </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Team Management</CardTitle>
                  <CardDescription className="text-gray-600">
                    Invite team members, assign roles, and manage permissions
                  </CardDescription>
        </div>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-gray-600 mb-4">
                  Invite team members, assign roles, and manage permissions for your agency
                </p>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Go to Team Page
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900">Workflow Preferences</CardTitle>
              <CardDescription className="text-gray-600">
                Configure default workflow settings for your agency
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-950 mb-1">Require Approval by Default</h3>
                  <p className="text-sm text-gray-600">
                    New posts will require client approval by default (can be changed per post)
                  </p>
                </div>
                <button
                      onClick={() =>
                    setSettings({ ...settings, defaultRequiresApproval: !settings.defaultRequiresApproval })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.defaultRequiresApproval !== false ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle default approval"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.defaultRequiresApproval !== false ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900">Appearance</CardTitle>
              <CardDescription className="text-gray-600">
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["dark", "light", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setSettings({ ...settings, theme });
                        setCurrentTheme(theme);
                        // Save immediately
                        if (userId) {
                          fetch("/api/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId, settings: { ...settings, theme } }),
                          }).catch(console.error);
                        }
                      }}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        currentTheme === theme
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <p className={`font-semibold capitalize text-sm ${
                        currentTheme === theme ? "text-purple-900" : "text-gray-950"
                      }`}>{theme}</p>
                    </button>
                  )              )}
                          </div>
                            </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Team Management</CardTitle>
                  <CardDescription className="text-gray-600">
                    Invite team members, assign roles, and manage permissions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-gray-600 mb-4">
                  Invite team members, assign roles, and manage permissions for your agency
                </p>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Go to Team Page
                </Button>
                            </div>
                          </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900">Email Notifications</CardTitle>
              <CardDescription className="text-gray-600">
                Configure when you receive email notifications
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-950 mb-1">Approval Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive emails when clients approve or request changes to posts
                  </p>
                        </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, emailApprovals: !settings.emailApprovals })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.emailApprovals !== false ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle approval notifications"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.emailApprovals !== false ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                            </div>
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>Task Assignment Notifications</h3>
                  <p className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Get notified when tasks are assigned to you or your team members
                  </p>
                        </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, emailTasks: !settings.emailTasks })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.emailTasks !== false ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle task notifications"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.emailTasks !== false ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                      </div>
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>General Notifications</h3>
                  <p className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Receive email updates about your content and account activity
                  </p>
                    </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifications: !settings.notifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.notifications ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle general notifications"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifications ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-lg font-semibold text-gray-900">AI Model Selection</CardTitle>
              <CardDescription className="text-gray-600">
                Choose your preferred AI model for content generation
              </CardDescription>
            </CardHeader>
            <div className="p-6">
              {/* Simple Dropdown Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select AI Model
                </label>
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-md text-left hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {(() => {
                        const selectedModel = aiModels.find(m => m.id === settings.defaultAIModel);
                        if (!selectedModel) return null;
                        return (
                          <>
                            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-gray-600">
                              {selectedModel.icon}
                            </div>
                            <span className={`font-medium text-sm ${
                              isDark ? "text-white" : "text-gray-950"
                            }`}>{selectedModel.name}</span>
                            <span className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}>•</span>
                            <span className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            }`}>{selectedModel.provider}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      } ${isModelDropdownOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>

                  {/* Simple Dropdown Menu */}
                  {isModelDropdownOpen && (
                    <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-64 overflow-y-auto ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-gray-300"
                    }`}>
                      <div className="py-1">
                        {aiModels.map((model) => {
                          const isSelected = settings.defaultAIModel === model.id;
                          return (
                            <button
                          key={model.id}
                              type="button"
                              onClick={() => {
                                setSettings({ ...settings, defaultAIModel: model.id });
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left text-sm ${
                                isDark
                                  ? isSelected ? "bg-slate-700" : "hover:bg-slate-700"
                                  : isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {model.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                  <span className={`font-medium ${
                                    isSelected
                                      ? isDark ? "text-white" : "text-gray-950"
                                      : isDark ? "text-gray-300" : "text-gray-700"
                                  }`}>
                                    {model.name}
                                  </span>
                                  <span className={`text-xs ${
                                    isDark ? "text-gray-600" : "text-gray-400"
                                  }`}>•</span>
                                  <span className={`text-xs ${
                                    isDark ? "text-gray-500" : "text-gray-500"
                                  }`}>{model.provider}</span>
                                  {isSelected && (
                                    <Check className={`w-4 h-4 ml-auto flex-shrink-0 ${
                                      isDark ? "text-purple-400" : "text-gray-950"
                                    }`} />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                            </div>
                </div>
                  )}
              </div>
              </div>
            </div>
          </Card>

          <Card className={`${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          } rounded-xl shadow-sm`}>
            <CardHeader className={`border-b ${
              isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <CardTitle className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Niche Selection</CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                Choose your niche to get personalized content ideas
              </CardDescription>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {niches.map((niche) => {
                  const Icon = niche.icon;
                  const isSelected = settings.niche === niche.id;
                  
                  return (
                <button
                      key={niche.id}
                      onClick={() => {
                        const newSettings = { ...settings, niche: niche.id };
                        setSettings(newSettings);
                        localStorage.setItem("userNiche", niche.id);
                        // Trigger storage event for other tabs
                        window.dispatchEvent(new Event("storage"));
                        showToast.success("Niche updated!", "Your content ideas will refresh");
                      }}
                      className={`relative p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? isDark
                            ? "border-purple-600 bg-purple-950/50 text-purple-200"
                            : "border-purple-600 bg-purple-50 text-purple-900"
                          : isDark
                          ? "border-slate-600 bg-slate-700 hover:border-slate-500"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? isDark ? "bg-purple-900/50" : "bg-purple-100"
                            : isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected
                              ? isDark ? "text-purple-400" : "text-purple-600"
                              : isDark ? "text-gray-400" : "text-gray-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{niche.emoji}</span>
                            <h3 className={`font-semibold text-sm ${
                              isSelected
                                ? isDark ? "text-purple-200" : "text-purple-900"
                                : isDark ? "text-white" : "text-gray-950"
                            }`}>
                              {niche.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className={`${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          } rounded-xl shadow-sm`}>
            <CardHeader className={`border-b ${
              isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <CardTitle className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Content Settings</CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                Configure your content generation preferences
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${
                    isDark ? "text-white" : "text-gray-950"
                  }`}>Auto-save Content</h3>
                  <p className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Automatically save generated content to history
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, autoSave: !settings.autoSave })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.autoSave ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle auto-save"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoSave ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className={`${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          } rounded-xl shadow-sm`}>
            <CardHeader className={`border-b ${
              isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <CardTitle className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}>Appearance</CardTitle>
              <CardDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className={`text-sm font-semibold mb-3 block ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["dark", "light", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setSettings({ ...settings, theme });
                        setCurrentTheme(theme);
                        // Save immediately
                        if (userId) {
                          fetch("/api/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId, settings: { ...settings, theme } }),
                          }).catch(console.error);
                        }
                      }}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        currentTheme === theme
                          ? isDark
                            ? "border-purple-600 bg-purple-950/50"
                            : "border-purple-600 bg-purple-50"
                          : isDark
                          ? "border-slate-600 bg-slate-700 hover:border-slate-500"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <p className={`font-semibold capitalize text-sm ${
                        currentTheme === theme
                          ? isDark ? "text-purple-300" : "text-purple-900"
                          : isDark ? "text-white" : "text-gray-950"
                      }`}>{theme}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button - Bottom Right */}
      <div className={`flex justify-end pt-6 border-t ${
        isDark ? "border-gray-800" : "border-gray-200"
      }`}>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-md px-6 py-2 text-sm font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

