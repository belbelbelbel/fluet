"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Bot,
  Zap,
  Sparkles,
  Brain,
  Check,
  Globe,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
} from "lucide-react";
import { showToast } from "@/lib/toast";

type AIModel = "gpt-4o-mini" | "gpt-4" | "claude-3-haiku" | "claude-3-sonnet" | "gemini-pro";

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
    icon: <Sparkles className="w-5 h-5" />,
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
}

export default function SettingsPage() {
  const { userId } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    defaultAIModel: "gpt-4o-mini",
    autoSave: true,
    notifications: true,
    theme: "dark",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSettings();
    }
  }, [userId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/settings?userId=${userId}`);
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your preferences and AI model selection
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
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

      <Tabs defaultValue="ai" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <TabsList className="bg-gray-900/50 border-gray-800 inline-flex min-w-full sm:min-w-0 px-4 sm:px-0">
            <TabsTrigger value="ai" className="flex-1 sm:flex-none">
              <Bot className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">AI Models</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex-1 sm:flex-none">
              <Settings className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 sm:flex-none">
              <Bell className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 sm:flex-none">
              <Palette className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Appearance</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Models Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 text-blue-400" />
                Default AI Model
              </CardTitle>
              <CardDescription>
                Choose your preferred AI model for content generation. You can change this anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {aiModels.map((model) => {
                  const isSelected = settings.defaultAIModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() =>
                        setSettings({ ...settings, defaultAIModel: model.id })
                      }
                      className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 ${model.color}`}
                          >
                            {model.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                              <h3 className="font-semibold text-white text-sm sm:text-base">{model.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {model.provider}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                              {model.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {getSpeedBadge(model.speed)}
                              {getQualityBadge(model.quality)}
                              <Badge variant="outline" className="text-xs">
                                {model.cost === "low"
                                  ? "Low Cost"
                                  : model.cost === "medium"
                                  ? "Medium Cost"
                                  : "High Cost"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          {isSelected && (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 flex items-center justify-center">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          )}
                          {!isSelected && (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Model Comparison */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Model Comparison</CardTitle>
              <CardDescription>
                Quick reference for model capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2 sm:px-4 text-gray-300">Model</th>
                        <th className="text-center py-3 px-2 sm:px-4 text-gray-300 hidden sm:table-cell">Speed</th>
                        <th className="text-center py-3 px-2 sm:px-4 text-gray-300 hidden sm:table-cell">Quality</th>
                        <th className="text-center py-3 px-2 sm:px-4 text-gray-300">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiModels.map((model) => (
                        <tr
                          key={model.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2">
                              <div className={model.color}>{model.icon}</div>
                              <div>
                                <span className="text-white font-medium block">{model.name}</span>
                                <div className="sm:hidden flex gap-2 mt-1">
                                  {getSpeedBadge(model.speed)}
                                  {getQualityBadge(model.quality)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                            {getSpeedBadge(model.speed)}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                            {getQualityBadge(model.quality)}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-center text-gray-400">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription>
                Configure your general application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1 text-sm sm:text-base">Auto-save Content</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Automatically save generated content to history
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, autoSave: !settings.autoSave })
                  }
                  className={`relative w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.autoSave ? "bg-blue-600" : "bg-gray-700"
                  }`}
                  aria-label="Toggle auto-save"
                >
                  <div
                    className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-5 h-5 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${
                      settings.autoSave ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1 text-sm sm:text-base">Email Notifications</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Receive email updates about your content
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifications: !settings.notifications })
                  }
                  className={`relative w-11 h-6 sm:w-12 sm:h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.notifications ? "bg-blue-600" : "bg-gray-700"
                  }`}
                  aria-label="Toggle notifications"
                >
                  <div
                    className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-5 h-5 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${
                      settings.notifications ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3 block">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(["dark", "light", "system"] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings({ ...settings, theme })}
                      className={`p-3 sm:p-4 rounded-lg border-2 text-center transition-all ${
                        settings.theme === theme
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <p className="font-medium text-white capitalize text-xs sm:text-sm">{theme}</p>
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

