"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Brain,
  Check,
  CheckCircle2,
  Circle,
  Save,
  Loader2,
  ChevronDown,
  PlayIcon,
  LinkIcon,
  Cpu,
  Calendar,
  CreditCard,
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
import Link from "next/link";

type AIModel = "deepseek-v4-flash" | "deepseek-v4-pro";

const niches = [
  {
    id: "home_food_vendor" as Niche,
    name: "Home Food Vendor",
    icon: UtensilsCrossed,
  },
  {
    id: "street_food_seller" as Niche,
    name: "Street Food Seller",
    icon: ShoppingBag,
  },
  {
    id: "baker_cake_vendor" as Niche,
    name: "Baker / Cake Vendor",
    icon: Cake,
  },
  {
    id: "fashion_seller" as Niche,
    name: "Fashion Seller",
    icon: Shirt,
  },
  {
    id: "beauty_hair_vendor" as Niche,
    name: "Beauty / Hair Vendor",
    icon: Scissors,
  },
  {
    id: "business_coach" as Niche,
    name: "Business / Coach",
    icon: Briefcase,
  },
  {
    id: "online_vendor" as Niche,
    name: "Online Vendor (IG Shop)",
    icon: Store,
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
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    description: "Best default — fast + cheap for tweets, captions, and ideas",
    speed: "fast",
    quality: "high",
    cost: "low",
    icon: <Bot className="w-4 h-4" />,
    color: "text-teal-600",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    description: "Higher quality for brand strategy, research, and long LinkedIn",
    speed: "medium",
    quality: "high",
    cost: "medium",
    icon: <Brain className="w-4 h-4" />,
    color: "text-sky-600",
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
    defaultAIModel: "deepseek-v4-flash",
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
  const [publishBusy, setPublishBusy] = useState<"check" | "run" | null>(null);
  const [publishReport, setPublishReport] = useState<{
    canAutoPostTwitter: boolean;
    tip: string;
    dueCount: number;
    readyCount: number;
    checks: { id: string; ok: boolean; label: string }[];
    duePosts: {
      id: number;
      platform: string;
      ready: boolean;
      reason: string;
      preview: string;
    }[];
    lastRun?: {
      successful: number;
      failed: number;
      skipped: number;
      actions: { id: number; platform: string; result: string }[];
    };
  } | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<{
    usageCount: number;
    limit: number;
    remainingQuota: number;
    usagePercentage: number;
    daysUntilReset: number;
    plan: string;
    isAtLimit: boolean;
    isNearLimit: boolean;
    hasActiveSubscription: boolean;
  } | null>(null);
  const [agencyStats, setAgencyStats] = useState({
    clients: 0,
    team: 0,
  });

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
        // Only adopt the server's theme when it was actually saved. A missing
        // row — or a failed query — returns the default with persisted:false,
        // and applying that would silently overwrite the local choice.
        if (data.persisted && data.theme && data.theme !== currentTheme) {
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

  const fetchBillingAndStats = async () => {
    if (!userId) return;
    try {
      const [usageRes, clientsRes, teamRes] = await Promise.all([
        fetch("/api/usage", { credentials: "include" }),
        fetch(`/api/clients?userId=${userId}`, { credentials: "include" }),
        fetch(`/api/team?userId=${userId}`, { credentials: "include" }),
      ]);
      if (usageRes.ok) {
        setUsage(await usageRes.json());
      }
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setAgencyStats((s) => ({
          ...s,
          clients: (data.clients || []).length,
        }));
      }
      if (teamRes.ok) {
        const data = await teamRes.json();
        setAgencyStats((s) => ({
          ...s,
          team: (data.members || []).length,
        }));
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSettings();
      fetchBillingAndStats();
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
      showToast.success("YouTube connected", "Ready for video uploads");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
    if (urlParams.get("twitter") === "connected") {
      checkTwitterConnection();
      showToast.success("Twitter connected", "Scheduled tweets can auto-publish");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
    if (urlParams.get("instagram") === "connected") {
      checkInstagramConnection();
      showToast.success("Instagram connected", "Image posts can auto-publish");
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
        const result = await response.json();
        if (result.persisted === false) {
          showToast.info(
            "Saved on this device",
            "Account sync wasn’t available — try again in a moment."
          );
        } else {
          showToast.success("Settings saved", "Your preferences are saved to your account");
        }
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
    return (
      <LoadingScreen
        variant="inline"
        message="Loading settings..."
        subtitle="Please wait while we load your settings"
      />
    );
  }

  // Calculate isDark after loading check to ensure resolvedTheme is available
  const isDark = resolvedTheme ? (currentTheme === "dark" || (currentTheme === "system" && resolvedTheme === "dark")) : false;

  return (
    <div className={`space-y-6 pt-6 max-w-4xl mx-auto px-4 transition-colors duration-300 bg-background min-h-screen`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 text-foreground`}>Settings</h1>
        <p className={`text-sm text-muted-foreground`}>Manage your preferences and AI model selection</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <div className={`border-b transition-colors duration-300 border-border -mx-4 sm:mx-0 px-4 sm:px-0`}>
          <TabsList className={`bg-transparent h-auto p-0 w-full justify-start gap-0 flex-wrap sm:flex-nowrap overflow-x-auto overflow-y-hidden scrollbar-hide border-0 ${
            ""
          }`}>
            <TabsTrigger value="agency" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <Bot className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Agency Profile</span>
              <span className="sm:hidden">Agency</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <LinkIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="team" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              Team
            </TabsTrigger>
            <TabsTrigger value="notifications" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="hidden md:inline">Notifications</span>
              <span className="md:hidden">Notify</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <Brain className="w-4 h-4 mr-2 flex-shrink-0" />
              AI
            </TabsTrigger>
            <TabsTrigger value="workflow" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <Cpu className="w-4 h-4 mr-2 flex-shrink-0" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="billing" className={`flex-shrink-0 px-3 sm:px-4 py-3 text-sm font-medium border-b-[3px] rounded-t-lg transition-all duration-200 -mb-px min-h-[44px] touch-manipulation ${
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:bg-muted data-[state=active]:font-semibold border-transparent text-muted-foreground hover:text-gray-950 dark:data-[state=active]:text-purple-300 dark:data-[state=active]:border-purple-500 dark:data-[state=active]:bg-purple-950/40 dark:border-transparent dark:text-slate-400 dark:hover:text-slate-300"
            }`}>
              <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
              Billing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Models Tab */}
        {/* Agency Profile Tab */}
        <TabsContent value="agency" className="space-y-6">
          <Card className={`bg-card border-border rounded-xl shadow-sm`}>
            <CardHeader className={`border-b border-border bg-muted/50`}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Agency Information</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Manage your agency profile and contact details
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-6">
        <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Agency Name
                </label>
                <input
                  type="text"
                  value={user?.fullName || ""}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg ${
                    "border-border bg-muted text-muted-foreground dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  "text-muted-foreground"
                }`}>
                  Agency name is managed through your account profile
          </p>
        </div>
              <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.primaryEmailAddress?.emailAddress || ""}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg ${
                    "border-border bg-muted text-muted-foreground dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                />
              </div>
              <div className={`pt-4 border-t ${
                "border-border dark:border-gray-800"
              }`}>
                <h3 className={`text-sm font-semibold mb-4 text-foreground`}>Quick Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${
                    "bg-muted border-purple-200 dark:bg-purple-950/50 dark:border-purple-900"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      "text-purple-900 dark:text-purple-300"
                    }`}>{agencyStats.clients}</div>
                    <div className={`text-sm ${
                      "text-foreground dark:text-purple-400"
                    }`}>Active Clients</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      "text-blue-900 dark:text-blue-300"
                    }`}>{agencyStats.team}</div>
                    <div className={`text-sm ${
                      "text-blue-700 dark:text-blue-400"
                    }`}>Team Members</div>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    "bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-900"
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      "text-green-900 dark:text-green-300"
                    }`}>{usage?.usageCount ?? 0}</div>
                    <div className={`text-sm ${
                      "text-green-700 dark:text-green-400"
                    }`}>Generations this month</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>
                Plan & usage
              </CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                See what’s included this month and upgrade when you need more.
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={`text-sm text-muted-foreground`}>Current plan</p>
                  <p className={`text-xl font-semibold text-foreground`}>
                    {usage?.plan || "Free"}
                  </p>
                </div>
                <Button asChild className="rounded-xl">
                  <Link href="/checkout?plan=pro">
                    {usage?.hasActiveSubscription ? "Change plan" : "Upgrade"}
                  </Link>
                </Button>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={"text-foreground/80"}>
                    Generations used
                  </span>
                  <span className={"text-muted-foreground"}>
                    {usage
                      ? `${usage.usageCount} / ${
                          usage.limit === Infinity || !Number.isFinite(usage.limit)
                            ? "∞"
                            : usage.limit
                        }`
                      : "—"}
                  </span>
                </div>
                <div
                  className={`h-2 rounded-full overflow-hidden bg-accent`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage?.isAtLimit
                        ? "bg-red-500"
                        : usage?.isNearLimit
                          ? "bg-amber-500"
                          : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min(100, usage?.usagePercentage ?? 0)}%`,
                    }}
                  />
                </div>
                <p className={`text-xs mt-2 text-muted-foreground/70`}>
                  {usage
                    ? usage.limit === Infinity || !Number.isFinite(usage.limit)
                      ? "Unlimited on your plan."
                      : `${usage.remainingQuota} left · resets in ${usage.daysUntilReset} day${
                          usage.daysUntilReset === 1 ? "" : "s"
                        }`
                    : "Loading usage…"}
                </p>
              </div>

              {usage?.isAtLimit ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  You’ve hit this month’s limit. Upgrade to keep generating.
                </div>
              ) : null}
            </div>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Social Media Integrations</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Connect your social media accounts for automated posting
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-6">
              {/* Prove publish loop */}
              <div
                className={`rounded-xl border p-4 bg-muted/50 border-border`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                  <div>
                    <h3 className={`font-semibold text-foreground`}>
                      Publish readiness
                    </h3>
                    <p className={`text-sm mt-0.5 text-muted-foreground`}>
                      Prove Twitter/Instagram auto-post without waiting on cron
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      variant="outline"
                      disabled={!!publishBusy}
                      onClick={async () => {
                        try {
                          setPublishBusy("check");
                          const res = await fetch("/api/publish/readiness", {
                            credentials: "include",
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Check failed");
                          setPublishReport({
                            canAutoPostTwitter: !!data.canAutoPostTwitter,
                            tip: data.tip || "",
                            dueCount: data.dueCount ?? 0,
                            readyCount: data.readyCount ?? 0,
                            checks: data.checks || [],
                            duePosts: data.duePosts || [],
                            lastRun: publishReport?.lastRun,
                          });
                          showToast.success(
                            data.canAutoPostTwitter ? "Twitter ready" : "Not ready yet",
                            data.tip || "See checklist below"
                          );
                        } catch (e) {
                          showToast.error(
                            "Check failed",
                            e instanceof Error ? e.message : "Try again"
                          );
                        } finally {
                          setPublishBusy(null);
                        }
                      }}
                    >
                      {publishBusy === "check" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Check readiness
                    </Button>
                    <Button
                      disabled={!!publishBusy}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={async () => {
                        try {
                          setPublishBusy("run");
                          const res = await fetch("/api/publish/run-due", {
                            method: "POST",
                            credentials: "include",
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Run failed");
                          setPublishReport((prev) => ({
                            canAutoPostTwitter: prev?.canAutoPostTwitter ?? false,
                            tip: prev?.tip || data.message || "",
                            dueCount: prev?.dueCount ?? 0,
                            readyCount: prev?.readyCount ?? 0,
                            checks: prev?.checks || [],
                            duePosts: prev?.duePosts || [],
                            lastRun: {
                              successful: data.successful ?? 0,
                              failed: data.failed ?? 0,
                              skipped: data.skipped ?? 0,
                              actions: data.actions || [],
                            },
                          }));
                          showToast.success(
                            "Run finished",
                            `${data.successful ?? 0} posted · ${data.failed ?? 0} failed · ${data.skipped ?? 0} skipped`
                          );
                        } catch (e) {
                          showToast.error(
                            "Run failed",
                            e instanceof Error ? e.message : "Try again"
                          );
                        } finally {
                          setPublishBusy(null);
                        }
                      }}
                    >
                      {publishBusy === "run" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <PlayIcon className="w-4 h-4 mr-2" />
                      )}
                      Run due posts now
                    </Button>
                  </div>
                </div>

                {publishReport ? (
                  <div
                    className={`rounded-xl border p-4 space-y-3 text-sm ${
                      "bg-white border-border dark:bg-slate-900/60 dark:border-slate-700"
                    }`}
                  >
                    <p className={"text-foreground/80"}>
                      {publishReport.canAutoPostTwitter
                        ? "Twitter token looks good."
                        : "Twitter not ready for auto-post yet."}{" "}
                      <span className={"text-muted-foreground"}>
                        {publishReport.readyCount}/{publishReport.dueCount} due posts ready
                      </span>
                    </p>
                    <ul className="space-y-1">
                      {publishReport.checks.map((c) => (
                        <li
                          key={c.id}
                          className={
                            c.ok
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-amber-800 dark:text-amber-200"
                          }
                        >
                          <span className="flex items-center gap-2">
                            {c.ok ? (
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 shrink-0" />
                            )}
                            {c.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {publishReport.duePosts.length > 0 ? (
                      <ul className={`space-y-2 pt-1 border-t ${"border-gray-100 dark:border-slate-700"}`}>
                        {publishReport.duePosts.slice(0, 8).map((p) => (
                          <li key={p.id} className={"text-foreground/80"}>
                            <span className="font-medium capitalize">#{p.id} {p.platform}</span>
                            {" — "}
                            {p.ready ? "ready" : p.reason}
                            <span className={`block text-xs truncate text-muted-foreground/70`}>
                              {p.preview}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`text-xs text-muted-foreground`}>
                        {publishReport.tip}
                      </p>
                    )}
                    {publishReport.lastRun ? (
                      <div className={`pt-2 border-t ${"border-gray-100 dark:border-slate-700"}`}>
                        <p className={`text-xs font-medium mb-1 text-muted-foreground`}>
                          Last run: {publishReport.lastRun.successful} posted ·{" "}
                          {publishReport.lastRun.failed} failed · {publishReport.lastRun.skipped} skipped
                        </p>
                        <ul className="space-y-1 text-xs">
                          {publishReport.lastRun.actions.slice(0, 10).map((a) => (
                            <li key={`${a.id}-${a.result}`} className={"text-muted-foreground"}>
                              #{a.id} {a.platform}: {a.result}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* YouTube Integration */}
              <div className={`rounded-xl border p-4 bg-muted/50 border-border`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-foreground`}>YouTube</h3>
                    <p className={`text-sm text-muted-foreground`}>Automated video uploads</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border bg-card border-border`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className={`flex items-center gap-2 text-sm break-words text-muted-foreground`}>
                          {settings.youtubeConnected ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                              Connected - Ready for automated uploads
                            </>
                          ) : (
                            "Not connected - Click to connect your YouTube account"
                          )}
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

              {/* Twitter */}
              <div className={`rounded-xl border p-4 bg-muted/50 border-border`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    X
                  </div>
                  <div>
                    <h3 className={`font-semibold text-foreground`}>
                      Twitter / X
                    </h3>
                    <p className={`text-sm text-muted-foreground`}>
                      Auto-post scheduled tweets when connected
                    </p>
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border bg-card border-border`}>
                  <p className={`flex items-center gap-2 text-sm text-muted-foreground`}>
                    {settings.twitterConnected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        Connected — scheduled tweets can auto-publish
                      </>
                    ) : (
                      "Not connected — connect to enable auto-posting"
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {settings.twitterConnected ? (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/twitter/disconnect", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ userId }),
                            });
                            if (response.ok) {
                              setSettings((prev) => ({ ...prev, twitterConnected: false }));
                              showToast.success("Twitter disconnected", "Auto-posting disabled");
                            } else {
                              const data = await response.json();
                              throw new Error(data.error || "Failed to disconnect");
                            }
                          } catch (error: unknown) {
                            showToast.error(
                              "Disconnect failed",
                              error instanceof Error ? error.message : "Try again"
                            );
                          }
                        }}
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Disconnect
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        window.location.href = "/api/twitter/auth";
                      }}
                      className={`w-full sm:w-auto ${
                        settings.twitterConnected
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : "bg-sky-500 hover:bg-sky-600 text-white"
                      }`}
                    >
                      {settings.twitterConnected ? "Reconnect" : "Connect Twitter"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instagram */}
              <div className={`rounded-xl border p-4 bg-muted/50 border-border`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                    IG
                  </div>
                  <div>
                    <h3 className={`font-semibold text-foreground`}>
                      Instagram
                    </h3>
                    <p className={`text-sm text-muted-foreground`}>
                      Auto-publish image posts when a public image URL is set
                    </p>
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border bg-card border-border`}>
                  <p className={`flex items-center gap-2 text-sm text-muted-foreground`}>
                    {settings.instagramConnected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        Connected — image posts can auto-publish
                      </>
                    ) : (
                      "Not connected — connect a Business/Creator account"
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {settings.instagramConnected ? (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/instagram/disconnect", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ userId }),
                            });
                            if (response.ok) {
                              setSettings((prev) => ({ ...prev, instagramConnected: false }));
                              showToast.success("Instagram disconnected", "Auto-posting disabled");
                            } else {
                              const data = await response.json();
                              throw new Error(data.error || "Failed to disconnect");
                            }
                          } catch (error: unknown) {
                            showToast.error(
                              "Disconnect failed",
                              error instanceof Error ? error.message : "Try again"
                            );
                          }
                        }}
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Disconnect
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        window.location.href = "/api/instagram/auth";
                      }}
                      className={`w-full sm:w-auto ${
                        settings.instagramConnected
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white"
                      }`}
                    >
                      {settings.instagramConnected ? "Reconnect" : "Connect Instagram"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Google Calendar */}
              <div className={`rounded-xl border p-4 bg-muted/50 border-border`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    "bg-blue-100 dark:bg-blue-900"
                  }`}>
                    <Calendar className={`w-5 h-5 ${"text-blue-700 dark:text-blue-300"}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-foreground`}>
                      Google Calendar
                    </h3>
                    <p className={`text-sm text-muted-foreground`}>
                      Calendar reminders for LinkedIn / TikTok manual posts
                    </p>
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border bg-card border-border`}>
                  <p className={`flex items-center gap-2 text-sm text-muted-foreground`}>
                    {settings.googleCalendarConnected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        Connected — due posts can create calendar events
                      </>
                    ) : (
                      "Not connected — optional reminders for manual platforms"
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {settings.googleCalendarConnected ? (
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/google-calendar/disconnect", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ userId }),
                            });
                            if (response.ok) {
                              setSettings((prev) => ({
                                ...prev,
                                googleCalendarConnected: false,
                              }));
                              showToast.success(
                                "Google Calendar disconnected",
                                "Calendar reminders disabled"
                              );
                            } else {
                              const data = await response.json();
                              throw new Error(data.error || "Failed to disconnect");
                            }
                          } catch (error: unknown) {
                            showToast.error(
                              "Disconnect failed",
                              error instanceof Error ? error.message : "Try again"
                            );
                          }
                        }}
                        className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Disconnect
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        window.location.href = "/api/google-calendar/auth";
                      }}
                      className={`w-full sm:w-auto ${
                        settings.googleCalendarConnected
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {settings.googleCalendarConnected
                        ? "Reconnect"
                        : "Connect Google Calendar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold text-foreground`}>Team Management</CardTitle>
                  <CardDescription className={"text-muted-foreground"}>
                    Invite team members, assign roles, and manage permissions
                  </CardDescription>
        </div>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="text-center py-8">
                <Check className={`w-12 h-12 mx-auto mb-4 ${"text-purple-300 dark:text-purple-400"}`} />
                <h3 className={`text-lg font-semibold mb-2 text-foreground`}>Team Collaboration</h3>
                <p className={`mb-4 text-muted-foreground`}>
                  Invite team members, assign roles, and manage permissions for your agency
                </p>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  variant="outline"
                  className={"border-purple-200 text-foreground hover:bg-muted dark:border-slate-600 dark:text-purple-300 dark:hover:bg-slate-700"}
                >
                  Go to Team Page
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Workflow Preferences</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Configure default workflow settings for your agency
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-muted/50 border-border`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 text-foreground`}>Require Approval by Default</h3>
                  <p className={`text-sm text-muted-foreground`}>
                    New posts will require client approval by default (can be changed per post)
                  </p>
                </div>
                <button
                      onClick={() =>
                    setSettings({ ...settings, defaultRequiresApproval: !settings.defaultRequiresApproval })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.defaultRequiresApproval !== false ? "bg-primary" : "bg-gray-300"
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
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Appearance</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className={`text-sm font-semibold mb-3 block text-foreground/80`}>
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
                          ? "border-primary bg-muted dark:border-purple-500 dark:bg-purple-900/40"
                          : "border-border bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className={`font-semibold capitalize text-sm ${
                        currentTheme === theme ? ("text-purple-900 dark:text-purple-300") : ("text-foreground")
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
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={`text-lg font-semibold text-foreground`}>Team Management</CardTitle>
                  <CardDescription className={"text-muted-foreground"}>
                    Invite team members, assign roles, and manage permissions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Manage Team
                </Button>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="text-center py-8">
                <Check className={`w-12 h-12 mx-auto mb-4 ${"text-purple-300 dark:text-purple-400"}`} />
                <h3 className={`text-lg font-semibold mb-2 text-foreground`}>Team Collaboration</h3>
                <p className={`mb-4 text-muted-foreground`}>
                  Invite team members, assign roles, and manage permissions for your agency
                </p>
                <Button
                  onClick={() => window.location.href = "/dashboard/team"}
                  variant="outline"
                  className={"border-purple-200 text-foreground hover:bg-muted dark:border-slate-600 dark:text-purple-300 dark:hover:bg-slate-700"}
                >
                  Go to Team Page
                </Button>
                            </div>
                          </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Email Notifications</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Configure when you receive email notifications
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-muted/50 border-border`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 text-foreground`}>Approval Notifications</h3>
                  <p className={`text-sm text-muted-foreground`}>
                    Receive emails when clients approve or request changes to posts
                  </p>
                        </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, emailApprovals: !settings.emailApprovals })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.emailApprovals !== false ? "bg-primary" : "bg-gray-300"
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
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-muted/50 border-border`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 text-foreground`}>Task Assignment Notifications</h3>
                  <p className={`text-sm text-muted-foreground`}>
                    Get notified when tasks are assigned to you or your team members
                  </p>
                        </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, emailTasks: !settings.emailTasks })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.emailTasks !== false ? "bg-primary" : "bg-gray-300"
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
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-muted/50 border-border`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 text-foreground`}>General Notifications</h3>
                  <p className={`text-sm text-muted-foreground`}>
                    Receive email updates about your content and account activity
                  </p>
                    </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, notifications: !settings.notifications })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.notifications ? "bg-primary" : "bg-gray-300"
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
          <Card className={"bg-card border-border rounded-xl shadow-sm"}>
            <CardHeader className={"border-b border-border bg-muted/50"}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>AI Model Selection</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Choose your preferred AI model for content generation
              </CardDescription>
            </CardHeader>
            <div className="p-6">
              {/* Simple Dropdown Selector */}
              <div>
                <label className={`block text-sm font-medium mb-2 text-foreground/80`}>
                  Select AI Model
                </label>
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-md text-left focus:outline-none focus:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-colors text-sm ${"bg-white border-border hover:border-gray-400 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500"}`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {(() => {
                        const selectedModel = aiModels.find(m => m.id === settings.defaultAIModel);
                        if (!selectedModel) return null;
                        return (
                          <>
                            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-muted-foreground`}>
                              {selectedModel.icon}
                            </div>
                            <span className={`font-medium text-sm text-foreground`}>{selectedModel.name}</span>
                            <span className={`text-xs ${
                              "text-muted-foreground"
                            }`}>•</span>
                            <span className={`text-xs ${
                              "text-muted-foreground"
                            }`}>{selectedModel.provider}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        "text-muted-foreground/70 dark:text-gray-500"
                      } ${isModelDropdownOpen ? 'transform rotate-180' : ''}`}
                    />
                  </button>

                  {/* Simple Dropdown Menu */}
                  {isModelDropdownOpen && (
                    <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-64 overflow-y-auto ${
                      "bg-white border-border dark:bg-slate-800 dark:border-slate-700"
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
                                  : isSelected ? "bg-muted" : "hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-muted-foreground`}>
                                {model.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                  <span className={`font-medium ${
                                    isSelected
                                      ? "text-foreground"
                                      : "text-foreground/80"
                                  }`}>
                                    {model.name}
                                  </span>
                                  <span className={`text-xs ${
                                    "text-muted-foreground/70 dark:text-gray-600"
                                  }`}>•</span>
                                  <span className={`text-xs ${
                                    "text-muted-foreground"
                                  }`}>{model.provider}</span>
                                  {isSelected && (
                                    <Check className={`w-4 h-4 ml-auto flex-shrink-0 ${
                                      "text-foreground dark:text-purple-400"
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

          <Card className={`bg-card border-border rounded-xl shadow-sm`}>
            <CardHeader className={`border-b border-border bg-muted/50`}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Niche Selection</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
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
                          ? "border-primary bg-muted text-purple-900 dark:border-primary dark:bg-purple-950/50 dark:text-purple-200"
                          : "border-border bg-white hover:border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-purple-100 dark:bg-purple-900/50"
                            : "bg-accent dark:bg-gray-700"
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected
                              ? "text-foreground dark:text-purple-400"
                              : "text-muted-foreground"
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm ${
                            isSelected
                              ? "text-foreground dark:text-slate-100"
                              : "text-foreground"
                          }`}>
                            {niche.name}
                          </h3>
                        </div>
                      </div>
                </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className={`bg-card border-border rounded-xl shadow-sm`}>
            <CardHeader className={`border-b border-border bg-muted/50`}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Content Settings</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Configure your content generation preferences
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border bg-muted/50 border-border`}>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 text-foreground`}>Auto-save Content</h3>
                  <p className={`text-sm text-muted-foreground`}>
                    Automatically save generated content to history
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, autoSave: !settings.autoSave })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    settings.autoSave ? "bg-primary" : "bg-gray-300"
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
          <Card className={`bg-card border-border rounded-xl shadow-sm`}>
            <CardHeader className={`border-b border-border bg-muted/50`}>
              <CardTitle className={`text-lg font-semibold text-foreground`}>Appearance</CardTitle>
              <CardDescription className={"text-muted-foreground"}>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div>
                <label className={`text-sm font-semibold mb-3 block text-foreground/80`}>
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
                          ? "border-primary bg-muted dark:border-primary dark:bg-purple-950/50"
                          : "border-border bg-white hover:border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500"
                      }`}
                    >
                      <p className={`font-semibold capitalize text-sm ${
                        currentTheme === theme
                          ? "text-purple-900 dark:text-purple-300"
                          : "text-foreground"
                      }`}>{theme}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save notice + button */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t ${
        "border-border dark:border-gray-800"
      }`}>
        <p className={`text-sm max-w-xl text-muted-foreground`}>
          <span className={`font-medium text-foreground/80`}>
            Preferences save to your account.
          </span>{" "}
          Connected accounts (Google, YouTube) are managed separately in Integrations.
        </p>
        <Button
          onClick={saveSettings}
          disabled={saving}
          variant="outline"
          className={`rounded-md px-6 py-2 text-sm font-medium shrink-0 ${
            "border-border text-foreground/80 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
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

