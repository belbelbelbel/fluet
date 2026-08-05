"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  BookOpen,
  Image as ImageIcon,
  Film,
  FileText,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import {
  getDailyContentIdeas,
  ContentIdea,
  Niche,
  HookStyle,
  Format,
  NICHE_OPTIONS,
  PRIMARY_INDUSTRY_OPTIONS,
  primaryIndustryToNiche,
  ContentStrategy,
  CONTENT_STRATEGIES,
  inferNicheFromIndustry,
  isSupportedNiche,
} from "@/lib/content-ideas";
import { showToast } from "@/lib/toast";

const hookStyleLabels: Record<HookStyle, string> = {
  story: "Story",
  question: "Question",
  shock: "Shock",
  value: "Value",
  tip: "Tip",
};

const formatLabels: Record<Format, { label: string; icon: LucideIcon }> = {
  text_only: { label: "Text Only", icon: FileText },
  text_image: { label: "Text + Image", icon: ImageIcon },
  carousel: { label: "Carousel", icon: BookOpen },
  video: { label: "Video", icon: Film },
};

function ContentIdeasPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const clientIdFromQuery = searchParams?.get("clientId") ?? null;

  const [clientName, setClientName] = useState<string | null>(null);
  const [niche, setNiche] = useState<Niche | string | null>(null);
  const [nicheDescription, setNicheDescription] = useState<string | null>(null);
  const [strategyFilter, setStrategyFilter] = useState<ContentStrategy | "all">("all");
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [customNicheInput, setCustomNicheInput] = useState("");
  const [refreshLimits, setRefreshLimits] = useState<{
    limit: number;
    used: number;
    remaining: number;
    canRefresh: boolean;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      if (clientIdFromQuery) {
        try {
          const [clientRes, bvRes] = await Promise.all([
            fetch(`/api/clients/${clientIdFromQuery}`, { credentials: "include" }),
            fetch(`/api/clients/${clientIdFromQuery}/brand-voice`, { credentials: "include" }),
          ]);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClientName(clientData?.client?.name ?? null);
          }
          let resolvedNiche: Niche | string | null = null;
          let resolvedDesc: string | null = null;
          if (bvRes.ok) {
            const bvData = await bvRes.json();
            const bv = bvData?.brandVoice;
            resolvedDesc = bv?.nicheDescription?.trim() || bv?.industry?.trim() || null;
            if (bv?.niche === "custom" && resolvedDesc) {
              resolvedNiche = "custom";
            } else if (bv?.niche && NICHE_OPTIONS.some((o) => o.id === bv.niche)) {
              resolvedNiche = bv.niche as Niche;
            } else if (bv?.industry && !bv?.niche) {
              const inferred = inferNicheFromIndustry(bv.industry);
              resolvedNiche = inferred || (resolvedDesc ? "custom" : null);
            }
          }
          if (resolvedNiche) {
            setNiche(resolvedNiche);
            setNicheDescription(resolvedDesc);
            if (isSupportedNiche(resolvedNiche)) {
              setTimeout(() => loadContentIdeas(resolvedNiche as Niche, "all"), 0);
            } else if (resolvedNiche === "custom" && resolvedDesc) {
              const checkRes = await fetch(
                `/api/content-ideas/generate?clientId=${clientIdFromQuery}`,
                { credentials: "include" }
              );
              const checkData = checkRes.ok ? await checkRes.json() : null;
              if (checkData?.cachedIdeas?.length) {
                setContentIdeas(checkData.cachedIdeas as ContentIdea[]);
              }
              setRefreshLimits(checkData?.refreshLimits || null);
              setLoading(false);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      } else {
        const savedNiche = localStorage.getItem("userNiche") as Niche | null;
        const savedDesc = localStorage.getItem("userNicheDescription");
        if (savedNiche === "custom" && savedDesc) {
          setNiche("custom");
          setNicheDescription(savedDesc);
          setLoading(false);
        } else if (savedNiche && NICHE_OPTIONS.some((o) => o.id === savedNiche)) {
          setNiche(savedNiche);
          setTimeout(() => loadContentIdeas(savedNiche, "all"), 0);
        } else {
          setLoading(false);
        }
      }
    };

    init();

    if (!clientIdFromQuery) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "userNiche" && e.newValue) {
          const newNiche = e.newValue as Niche;
          setNiche(newNiche);
          if (isSupportedNiche(newNiche)) {
            loadContentIdeas(newNiche, strategyFilter);
          }
          showToast.success("Niche updated!", "Content ideas refreshed");
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [clientIdFromQuery]);

  const loadContentIdeas = (userNiche: Niche, strategy?: ContentStrategy | "all") => {
    setLoading(true);
    const strat = strategy ?? strategyFilter;
    const loadIdeas = () => {
      try {
        const ideas = getDailyContentIdeas(
          userNiche,
          5,
          strat === "all" ? undefined : strat
        );
        setContentIdeas(ideas);
      } catch (error) {
        console.error("Error loading content ideas:", error);
        showToast.error("Error", "Failed to load content ideas");
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback?.(loadIdeas, { timeout: 100 });
    } else {
      setTimeout(loadIdeas, 0);
    }
  };

  const handleRefresh = () => {
    if (!niche) return;
    if (isSupportedNiche(niche)) {
      loadContentIdeas(niche as Niche, strategyFilter);
      showToast.success("Refreshed!", "New content ideas loaded");
    } else if (niche === "custom" && clientIdFromQuery) {
      handleGenerateIdeas(true);
    }
  };

  const handleGenerateIdeas = async (forceRefresh = false) => {
    if (!clientIdFromQuery) return;
    setGeneratingIdeas(true);
    try {
      const res = await fetch("/api/content-ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientId: clientIdFromQuery, forceRefresh }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast.error(data.error || "Failed", data.details || "Please try again");
        if (data.refreshLimits) setRefreshLimits(data.refreshLimits);
        return;
      }
      setContentIdeas((data.ideas || []) as ContentIdea[]);
      setRefreshLimits(data.refreshLimits || null);
      showToast.success("Ideas ready!", data.source === "cache" ? "Loaded from cache" : "Fresh ideas generated");
    } catch {
      showToast.error("Error", "Failed to generate ideas");
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleStrategyChange = (strat: ContentStrategy | "all") => {
    setStrategyFilter(strat);
    if (niche && isSupportedNiche(niche)) {
      loadContentIdeas(niche as Niche, strat);
    }
  };

  const handleSelectNiche = async (selectedNiche: Niche | "custom", desc?: string) => {
    setLoading(true);
    setNiche(selectedNiche);
    if (selectedNiche === "custom") setNicheDescription(desc || null);

    if (clientIdFromQuery) {
      try {
        const bvRes = await fetch(`/api/clients/${clientIdFromQuery}/brand-voice`, {
          credentials: "include",
        });
        const bvData = (bvRes.ok && (await bvRes.json()))?.brandVoice || {};
        const bv = {
          ...bvData,
          niche: selectedNiche,
          nicheDescription: selectedNiche === "custom" ? (desc || "") : bvData.nicheDescription,
        };
        await fetch(`/api/clients/${clientIdFromQuery}/brand-voice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bv),
        });
        showToast.success("Saved!", "Content ideas for this client");
      } catch {
        showToast.error("Couldn't save", "Try saving in Brand Voice");
      }
    } else {
      localStorage.setItem("userNiche", selectedNiche);
      if (selectedNiche === "custom" && desc) {
        localStorage.setItem("userNicheDescription", desc);
      }
      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche: selectedNiche }),
        });
      } catch {
        // Ignore
      }
      showToast.success("Niche selected!", "Content ideas loaded");
    }

    if (isSupportedNiche(selectedNiche)) {
      loadContentIdeas(selectedNiche as Niche, strategyFilter);
    } else if (selectedNiche === "custom" && desc && clientIdFromQuery) {
      const checkRes = await fetch(
        `/api/content-ideas/generate?clientId=${clientIdFromQuery}`,
        { credentials: "include" }
      );
      const checkData = checkRes.ok ? await checkRes.json() : null;
      if (checkData?.cachedIdeas?.length) {
        setContentIdeas(checkData.cachedIdeas as ContentIdea[]);
      } else {
        setContentIdeas([]);
      }
      setRefreshLimits(checkData?.refreshLimits || null);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleGenerateCaption = (idea: ContentIdea) => {
    const params = new URLSearchParams();
    params.set("id", idea.id);
    if (clientIdFromQuery) params.set("clientId", clientIdFromQuery);
    router.push(`/dashboard/generate-caption?${params.toString()}`);
  };

  const handleSaveToStack = (idea: ContentIdea) => {
    // Save to post stack (localStorage for now)
    const stack = JSON.parse(localStorage.getItem("postStack") || "[]");
    stack.push({
      ideaId: idea.id,
      topic: idea.topic,
      hookExample: idea.hookExample,
      format: idea.format,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem("postStack", JSON.stringify(stack));
    showToast.success("Saved!", "Added to your post stack");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center">
          <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-4 ${
            isDark ? "text-purple-400" : "text-blue-600"
          }`} />
          <p className={isDark ? "text-slate-300" : "text-gray-600"}>Loading content ideas...</p>
        </div>
      </div>
    );
  }

  // No niche selected – show Primary Industry picker
  if (!niche) {
    const customIndustries = ["other", "health_fitness", "real_estate", "creative_services", "tech_startups"];
    return (
      <div className={`min-h-screen py-8 px-4 sm:px-6 transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-950"}`}>
              {clientIdFromQuery ? "Pick industry for this client" : "Pick your industry"}
            </h1>
            <p className={isDark ? "text-slate-400" : "text-gray-600"}>
              {clientIdFromQuery
                ? `Select the primary industry for ${clientName || "this client"} to get tailored ideas`
                : "Choose who you create content for to get personalized ideas"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {PRIMARY_INDUSTRY_OPTIONS.map((opt) => {
              const isCustom = customIndustries.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (isCustom) return;
                    const mapped = primaryIndustryToNiche(opt.id);
                    handleSelectNiche(mapped === "custom" ? "custom" : (mapped as Niche), undefined);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    isDark
                      ? "border-slate-700 bg-slate-800 hover:border-purple-500 hover:bg-slate-700/50"
                      : "border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50/50"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={`font-medium ${isDark ? "text-white" : "text-gray-950"}`}>
                    {opt.name}
                  </span>
                </button>
              );
            })}
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? "text-slate-200" : "text-gray-700"}`}>
              Health & Fitness, Real Estate, Tech, Creative, or Other?
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNicheInput}
                onChange={(e) => setCustomNicheInput(e.target.value)}
                placeholder="e.g. Online Fitness Coach for Women"
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  isDark ? "bg-slate-900 border-slate-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <Button
                onClick={() => customNicheInput.trim() && handleSelectNiche("custom", customNicheInput.trim())}
                disabled={!customNicheInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Use This
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 sm:space-y-8 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b transition-colors duration-300 ${
        isDark ? "border-slate-700" : "border-gray-200"
      }`}>
        <div className="flex-1 min-w-0">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>
            Daily Content Ideas
            {clientName && (
              <span className="text-purple-600 dark:text-purple-400 font-semibold ml-2">
                for {clientName}
              </span>
            )}
          </h1>
          <p className={`text-sm sm:text-base ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Fresh ideas tailored for {clientName ? "this client" : "your niche"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={strategyFilter}
            onChange={(e) => handleStrategyChange(e.target.value as ContentStrategy | "all")}
            className={`rounded-xl border text-sm px-3 py-2 ${
              isDark
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All strategies</option>
            {CONTENT_STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() =>
              clientIdFromQuery
                ? router.push(`/dashboard/clients/${clientIdFromQuery}/brand-voice`)
                : router.push("/dashboard/settings")
            }
            variant="outline"
            className={`flex-1 sm:flex-none rounded-xl text-xs sm:text-sm transition-all duration-200 ${
              isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            {clientIdFromQuery ? "Edit in Brand Voice" : "Change Niche"}
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className={`flex-1 sm:flex-none rounded-xl text-xs sm:text-sm transition-all duration-200 ${
              isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content Ideas List */}
      <div className="space-y-3 sm:space-y-4">
        {contentIdeas.length > 0 ? (
          contentIdeas.map((idea) => {
            const FormatIcon = formatLabels[idea.format].icon;
            
            return (
              <Card key={idea.id} className={`border rounded-xl transition-all duration-200 ${
                isDark 
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}>
                <CardContent className="p-4 sm:p-5">
                  {/* Topic Header */}
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? "bg-purple-500/20" : "bg-purple-100"
                    }`}>
                      <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isDark ? "text-purple-400" : "text-purple-600"
                      }`} />
                    </div>
                    <h3 className={`text-base sm:text-lg font-semibold flex-1 leading-tight ${
                      isDark ? "text-white" : "text-gray-950"
                    }`}>
                      {idea.topic}
                    </h3>
                  </div>

                    {/* Hook Example */}
                    <div className="mb-3 sm:mb-4">
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 sm:mb-2 ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>Hook Example</p>
                      <div className={`border rounded-lg p-2.5 sm:p-3 ${
                        isDark 
                          ? "bg-slate-900/50 border-slate-700" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <p className={`text-xs sm:text-sm leading-relaxed ${
                          isDark ? "text-slate-200" : "text-gray-950"
                        }`}>
                          &ldquo;{idea.hookExample}&rdquo;
                        </p>
                        {idea.strategyTip && (
                          <p className={`text-xs mt-2 pt-2 border-t ${
                            isDark ? "border-slate-700 text-slate-400" : "border-gray-200 text-gray-500"
                          }`}>
                            Why it works: {idea.strategyTip}
                          </p>
                        )}
                      </div>
                    </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {idea.strategy && (
                      <Badge className={`${
                        isDark 
                          ? "bg-purple-900/50 text-purple-300 border-purple-700" 
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {CONTENT_STRATEGIES.find((s) => s.id === idea.strategy)?.name ?? idea.strategy}
                      </Badge>
                    )}
                    <Badge className={`${
                      isDark 
                        ? "bg-slate-700 text-slate-200 border-slate-600" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {hookStyleLabels[idea.hookStyle]} Hook
                    </Badge>
                    <Badge className={`flex items-center gap-1.5 ${
                      isDark 
                        ? "bg-slate-700 text-slate-200 border-slate-600" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      <FormatIcon className="w-3.5 h-3.5" />
                      {formatLabels[idea.format].label}
                    </Badge>
                    {idea.description && (
                      <p className={`text-sm ml-auto ${
                        isDark ? "text-slate-400" : "text-gray-600"
                      }`}>
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t transition-colors duration-300 ${
                    isDark ? "border-slate-700" : "border-gray-200"
                  }`}>
                    <Button
                      onClick={() => handleGenerateCaption(idea)}
                      className={`flex-1 text-white rounded-xl py-2.5 sm:py-2 text-sm transition-all duration-200 shadow-sm hover:shadow-md ${
                        isDark
                          ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
                          : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950"
                      }`}
                    >
                      Generate Caption
                    </Button>
                    <Button
                      onClick={() => handleSaveToStack(idea)}
                      variant="outline"
                      className={`flex-1 rounded-xl flex items-center justify-center gap-2 py-2.5 sm:py-2 text-sm transition-all duration-200 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Save to Stack
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              );
            })
        ) : niche === "custom" && clientIdFromQuery ? (
          <Card className={`border rounded-xl transition-colors duration-300 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-12 text-center">
              <Lightbulb className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                Generate ideas for your niche
              </h3>
              <p className={`text-base mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                AI will create 10 tailored content ideas for &ldquo;{nicheDescription || "your niche"}&rdquo;. Strategic, scroll-stopping, ready to use.
              </p>
              {refreshLimits && !refreshLimits.canRefresh && (
                <p className={`text-sm mb-4 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                  Refresh limit reached ({refreshLimits.used}/{refreshLimits.limit} this month). Upgrade for more.
                </p>
              )}
              <Button
                onClick={() => handleGenerateIdeas(false)}
                disabled={generatingIdeas || !!(refreshLimits && !refreshLimits.canRefresh)}
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {generatingIdeas ? (
                  <>Generating...</>
                ) : (
                  <>Generate Ideas for &ldquo;{nicheDescription || "my niche"}&rdquo;</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className={`border rounded-xl transition-colors duration-300 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          }`}>
            <CardContent className="p-12 text-center">
              <Lightbulb className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? "text-slate-500" : "text-gray-400"
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? "text-white" : "text-gray-950"
              }`}>
                No content ideas yet
              </h3>
              <p className={`text-base mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}>
                We&apos;re working on adding more ideas for your niche
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className={`rounded-xl transition-all duration-200 ${
                  isDark
                    ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Stack Button */}
      <div className="text-center pt-4">
        <Button
          onClick={() => router.push("/dashboard/post-stack")}
          variant="outline"
          className={`rounded-xl transition-all duration-200 ${
            isDark
              ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
              : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
          }`}
        >
          View Post Stack
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function ContentIdeasPage() {
  return (
    <Suspense fallback={
      <LoadingScreen variant="inline" message="Loading content ideas..." />
    }>
      <ContentIdeasPageInner />
    </Suspense>
  );
}
