"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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
}

export default function SettingsPage() {
  const { userId } = useAuth();
  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    defaultAIModel: "gpt-4o-mini",
    autoSave: true,
    notifications: true,
    theme: currentTheme,
    niche: (localStorage.getItem("userNiche") as Niche) || undefined,
    youtubeConnected: false, // Will be checked from database/API
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Check YouTube connection when component mounts or URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("youtube") === "connected") {
      checkYouTubeConnection();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-950 mb-1">Settings</h1>
        <p className="text-sm text-gray-600">Manage your preferences and AI model selection</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 w-full sm:w-auto justify-start gap-0">
            <TabsTrigger value="ai" className="px-4 py-2 text-sm font-medium data-[state=active]:text-gray-950 data-[state=active]:border-b-2 data-[state=active]:border-gray-950 text-gray-600 border-b-2 border-transparent rounded-none">
              AI Models
            </TabsTrigger>
            <TabsTrigger value="general" className="px-4 py-2 text-sm font-medium data-[state=active]:text-gray-950 data-[state=active]:border-b-2 data-[state=active]:border-gray-950 text-gray-600 border-b-2 border-transparent rounded-none">
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-4 py-2 text-sm font-medium data-[state=active]:text-gray-950 data-[state=active]:border-b-2 data-[state=active]:border-gray-950 text-gray-600 border-b-2 border-transparent rounded-none">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="px-4 py-2 text-sm font-medium data-[state=active]:text-gray-950 data-[state=active]:border-b-2 data-[state=active]:border-gray-950 text-gray-600 border-b-2 border-transparent rounded-none">
              Appearance
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Models Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-950 mb-1">Default AI Model</h2>
              <p className="text-sm text-gray-600">Choose your preferred AI model for content generation.</p>
            </div>
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
                            <span className="font-medium text-gray-950 text-sm">{selectedModel.name}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{selectedModel.provider}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isModelDropdownOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>

                  {/* Simple Dropdown Menu */}
                  {isModelDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
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
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left text-sm ${
                                isSelected ? "bg-gray-50" : ""
                              }`}
                            >
                              <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-gray-600">
                                {model.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isSelected ? "text-gray-950" : "text-gray-700"}`}>
                                    {model.name}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{model.provider}</span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-gray-950 ml-auto flex-shrink-0" />
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
          </div>

        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-white border border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-950">Niche Selection</CardTitle>
              <CardDescription className="text-gray-600">
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
                          ? "border-purple-600 bg-purple-50 text-purple-900"
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
                          isSelected ? "bg-purple-100" : "bg-gray-100"
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected ? "text-purple-600" : "text-gray-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{niche.emoji}</span>
                            <h3 className={`font-semibold text-sm ${
                              isSelected ? "text-purple-900" : "text-gray-950"
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

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-950 mb-1">General Settings</h2>
              <p className="text-sm text-gray-600">Configure your general application preferences</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-950 mb-1">Auto-save Content</h3>
                  <p className="text-sm text-gray-600">
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
          </div>

          {/* YouTube Integration */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-950 mb-1">YouTube Integration</h2>
              <p className="text-sm text-gray-600">
                Connect your YouTube account to enable automated video uploads
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-950 mb-1">YouTube Account</h3>
                    <p className="text-sm text-gray-600 break-words">
                      {settings.youtubeConnected 
                        ? "Connected - Ready for automated uploads"
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
                            // Refresh connection status to ensure UI is updated
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
                      // Redirect to OAuth flow
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
              {settings.youtubeConnected && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 break-words">
                    ✅ Your YouTube account is connected. You can now schedule and upload videos automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-950 mb-1">Notification Preferences</h2>
              <p className="text-sm text-gray-600">Control how and when you receive notifications</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-950 mb-1">Email Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive email updates about your content
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifications: !settings.notifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.notifications ? "bg-purple-600" : "bg-gray-300"
                  }`}
                  aria-label="Toggle notifications"
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifications ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-950 mb-1">Appearance</h2>
              <p className="text-sm text-gray-600">Customize the look and feel of your dashboard</p>
            </div>
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button - Bottom Right */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gray-950 hover:bg-gray-900 text-white rounded-md px-6 py-2 text-sm font-medium"
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

