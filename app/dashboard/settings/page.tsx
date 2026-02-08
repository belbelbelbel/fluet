"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Bot,
  Zap,
  Brain,
  Check,
  Globe,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  ChevronDown,
  PlayIcon,
  LinkIcon,
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
    icon: <Zap className="w-5 h-5" />,
    color: "text-green-400",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most advanced model with superior quality and creativity",
    speed: "medium",
    quality: "high",
    cost: "high",
    icon: <Brain className="w-5 h-5" />,
    color: "text-blue-400",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Lightning-fast responses with good quality",
    speed: "fast",
    quality: "medium",
    cost: "low",
    icon: <Zap className="w-5 h-5" />,
    color: "text-purple-400",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance with excellent reasoning",
    speed: "medium",
    quality: "high",
    cost: "medium",
    icon: <Bot className="w-5 h-5" />,
    color: "text-indigo-400",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Great for diverse content types and multilingual support",
    speed: "fast",
    quality: "high",
    cost: "medium",
    icon: <Globe className="w-5 h-5" />,
    color: "text-yellow-400",
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
  const [settings, setSettings] = useState<UserSettings>({
    defaultAIModel: "gpt-4o-mini",
    autoSave: true,
    notifications: true,
    theme: "dark",
    niche: (localStorage.getItem("userNiche") as Niche) || undefined,
    youtubeConnected: false, // Will be checked from database/API
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchSettings();
      checkYouTubeConnection();
    }
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

  const checkYouTubeConnection = async () => {
    try {
      const response = await fetch("/api/youtube/status");
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, youtubeConnected: data.connected }));
      }
    } catch (error) {
      console.error("Error checking YouTube connection:", error);
    }
  };

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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/settings`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, settings }),
      });

      if (response.ok) {
        showToast.success("Settings saved", "Your preferences have been updated");
      } else {
        showToast.error("Failed to save", "Please try again");
      }
    } catch (error) {
      showToast.error("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getSpeedBadge = (speed: string) => {
    switch (speed) {
      case "fast":
        return <Badge variant="success">Fast</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      default:
        return <Badge variant="secondary">Slow</Badge>;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "high":
        return <Badge variant="success">High Quality</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      default:
        return <Badge variant="secondary">Basic</Badge>;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 mb-2">Settings</h1>
          <p className="text-base text-gray-600">
            Manage your preferences and AI model selection
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
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

      <Tabs defaultValue="ai" className="space-y-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <TabsList className="bg-gray-100 border border-gray-200 inline-flex min-w-full sm:min-w-0 px-4 sm:px-0 rounded-xl">
            <TabsTrigger value="ai" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-gray-950 text-gray-600">
              <Bot className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">AI Models</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Settings className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Bell className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-600">
              <Palette className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Appearance</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Models Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-950">
                <Bot className="w-5 h-5 text-gray-700" />
                Default AI Model
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose your preferred AI model for content generation. You can change this anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Custom Dropdown Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-950 mb-3">
                    Select AI Model
                  </label>
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {(() => {
                          const selectedModel = aiModels.find(m => m.id === settings.defaultAIModel);
                          if (!selectedModel) return null;
                          return (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-700">
                                {selectedModel.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-950 text-base">{selectedModel.name}</span>
                                  <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                    {selectedModel.provider}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {getSpeedBadge(selectedModel.speed)}
                                  {getQualityBadge(selectedModel.quality)}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isModelDropdownOpen ? 'transform rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isModelDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                        <div className="py-2">
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
                                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                                  isSelected ? "bg-purple-600 text-white" : ""
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isSelected ? "bg-white/20" : "bg-gray-100 text-gray-700"
                                }`}>
                            {model.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-950"}`}>
                                      {model.name}
                                    </span>
                                    <Badge className={`text-xs ${
                                      isSelected ? "bg-white/20 text-white border-white/30" : "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}>
                                {model.provider}
                              </Badge>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-white flex-shrink-0" />
                                    )}
                            </div>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {model.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {getSpeedBadge(model.speed)}
                              {getQualityBadge(model.quality)}
                                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                                {model.cost === "low"
                                  ? "Low Cost"
                                  : model.cost === "medium"
                                  ? "Medium Cost"
                                  : "High Cost"}
                              </Badge>
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

                {/* Selected Model Details */}
                {(() => {
                  const selectedModel = aiModels.find(m => m.id === settings.defaultAIModel);
                  if (!selectedModel) return null;
                  
                  return (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700">
                          {selectedModel.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-950 text-lg">{selectedModel.name}</h3>
                            <Badge className="bg-white text-gray-700 border-gray-200 text-xs">
                              {selectedModel.provider}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            {selectedModel.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {getSpeedBadge(selectedModel.speed)}
                            {getQualityBadge(selectedModel.quality)}
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                              {selectedModel.cost === "low"
                                ? "Low Cost"
                                : selectedModel.cost === "medium"
                                ? "Medium Cost"
                                : "High Cost"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Model Comparison */}
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-950">Model Comparison</CardTitle>
              <CardDescription className="text-gray-600">
                Quick reference for model capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Model</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold hidden sm:table-cell">Speed</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold hidden sm:table-cell">Quality</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map((model) => (
                        <tr
                          key={model.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="text-gray-700">{model.icon}</div>
                              <div>
                                <span className="text-gray-950 font-medium block">{model.name}</span>
                                <div className="sm:hidden flex gap-2 mt-1">
                                  {getSpeedBadge(model.speed)}
                                  {getQualityBadge(model.quality)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {getSpeedBadge(model.speed)}
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {getQualityBadge(model.quality)}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-600">
                            {model.cost === "low" ? "Low" : model.cost === "medium" ? "Medium" : "High"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-950">Niche Selection</CardTitle>
              <CardDescription className="text-gray-600">
                Choose your niche to get personalized content ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-gray-950 bg-gray-950 text-white shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-gray-950" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-white/20" : "bg-gray-100"
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected ? "text-white" : "text-gray-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{niche.emoji}</span>
                            <h3 className={`font-bold text-sm ${
                              isSelected ? "text-white" : "text-gray-950"
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
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-900">General Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Configure your general application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Auto-save Content</h3>
                  <p className="text-sm text-gray-600">
                    Automatically save generated content to history
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, autoSave: !settings.autoSave })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.autoSave ? "bg-gray-900" : "bg-gray-300"
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
            </CardContent>
          </Card>

          {/* YouTube Integration */}
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-900">YouTube Integration</CardTitle>
              <CardDescription className="text-gray-600">
                Connect your YouTube account to enable automated video uploads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">YouTube Account</h3>
                    <p className="text-sm text-gray-600">
                      {settings.youtubeConnected 
                        ? "Connected - Ready for automated uploads"
                        : "Not connected - Click to connect your YouTube account"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Redirect to OAuth flow
                    window.location.href = "/api/youtube/auth";
                  }}
                  className={`flex-shrink-0 ${
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
              {settings.youtubeConnected && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Your YouTube account is connected. You can now schedule and upload videos automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-900">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-600">
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Email Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive email updates about your content
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifications: !settings.notifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.notifications ? "bg-gray-900" : "bg-gray-300"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-white border-gray-200 rounded-xl">
            <CardHeader>
              <CardTitle className="text-gray-900">Appearance</CardTitle>
              <CardDescription className="text-gray-600">
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["dark", "light", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings({ ...settings, theme })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        settings.theme === theme
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 capitalize text-sm">{theme}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

