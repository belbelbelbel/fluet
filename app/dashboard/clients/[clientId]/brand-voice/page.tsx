"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import {
  PRIMARY_INDUSTRY_OPTIONS,
  primaryIndustryToNiche,
  type PrimaryIndustry,
} from "@/lib/content-ideas";

interface BrandVoice {
  brandDescription?: string;
  targetAudience?: string;
  niche?: string;
  primaryIndustry?: string;
  nicheDescription?: string;
  tone?: string;
  slangLevel?: string;
  industry?: string;
  dos?: string[];
  donts?: string[];
  examplePosts?: string[];
  preferredHashtags?: string[];
  bannedWords?: string[];
}

export default function BrandVoicePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId ? parseInt(params.clientId as string) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    brandDescription: "",
    targetAudience: "",
    niche: "",
    primaryIndustry: "",
    nicheDescription: "",
    tone: "",
    slangLevel: "none",
    industry: "",
    dos: [],
    donts: [],
    examplePosts: [],
    preferredHashtags: [],
    bannedWords: [],
  });

  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");
  const [newHashtag, setNewHashtag] = useState("");
  const [newBannedWord, setNewBannedWord] = useState("");

  useEffect(() => {
    if (!clientId) return;

    const fetchBrandVoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}/brand-voice`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.brandVoice) {
            setBrandVoice({
              brandDescription: data.brandVoice.brandDescription || "",
              targetAudience: data.brandVoice.targetAudience || "",
              niche: data.brandVoice.niche || "",
              primaryIndustry: data.brandVoice.primaryIndustry || "",
              nicheDescription: data.brandVoice.nicheDescription || "",
              tone: data.brandVoice.tone || "",
              slangLevel: data.brandVoice.slangLevel || "none",
              industry: data.brandVoice.industry || "",
              dos: Array.isArray(data.brandVoice.dos) ? data.brandVoice.dos : [],
              donts: Array.isArray(data.brandVoice.donts) ? data.brandVoice.donts : [],
              examplePosts: Array.isArray(data.brandVoice.examplePosts) ? data.brandVoice.examplePosts : [],
              preferredHashtags: Array.isArray(data.brandVoice.preferredHashtags) ? data.brandVoice.preferredHashtags : [],
              bannedWords: Array.isArray(data.brandVoice.bannedWords) ? data.brandVoice.bannedWords : [],
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch brand voice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandVoice();
  }, [clientId]);

  const handleSave = async () => {
    if (!clientId) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${clientId}/brand-voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(brandVoice),
      });

      if (response.ok) {
        alert("Brand voice saved successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save brand voice");
      }
    } catch (error) {
      console.error("Error saving brand voice:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: "do" | "dont" | "hashtag" | "bannedWord") => {
    const value = type === "do" ? newDo : type === "dont" ? newDont : type === "hashtag" ? newHashtag : newBannedWord;
    if (!value.trim()) return;

    const key = type === "do" ? "dos" : type === "dont" ? "donts" : type === "hashtag" ? "preferredHashtags" : "bannedWords";
    setBrandVoice({
      ...brandVoice,
      [key]: [...(brandVoice[key] || []), value.trim()],
    });

    if (type === "do") setNewDo("");
    if (type === "dont") setNewDont("");
    if (type === "hashtag") setNewHashtag("");
    if (type === "bannedWord") setNewBannedWord("");
  };

  const removeItem = (type: "do" | "dont" | "hashtag" | "bannedWord", index: number) => {
    const key = type === "do" ? "dos" : type === "dont" ? "donts" : type === "hashtag" ? "preferredHashtags" : "bannedWords";
    setBrandVoice({
      ...brandVoice,
      [key]: (brandVoice[key] || []).filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Brand Voice & Content Bank</h1>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">Brand Voice Settings</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure how AI generates content for this client
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Brand Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Description
            </label>
            <textarea
              value={brandVoice.brandDescription || ""}
              onChange={(e) => setBrandVoice({ ...brandVoice, brandDescription: e.target.value })}
              placeholder="What makes your brand unique? Personality, positioning, emotional tone..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used by AI to match your brand voice in generated content
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <textarea
              value={brandVoice.targetAudience || ""}
              onChange={(e) => setBrandVoice({ ...brandVoice, targetAudience: e.target.value })}
              placeholder="Who do you serve? Demographics, goals, pain points, language patterns..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            />
          </div>

          {/* Primary Industry + Specific Niche (for Content Ideas) */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Industry
              </label>
              <select
                value={brandVoice.primaryIndustry || ""}
                onChange={(e) => {
                  const v = e.target.value as PrimaryIndustry | "";
                  const mapped = v ? primaryIndustryToNiche(v) : "";
                  setBrandVoice({
                    ...brandVoice,
                    primaryIndustry: v,
                    niche: mapped === "custom" ? "custom" : mapped || "",
                    nicheDescription: mapped === "custom" ? (brandVoice.nicheDescription || "") : "",
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
              >
                <option value="">Select industry</option>
                {PRIMARY_INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.emoji} {opt.name}
                  </option>
                ))}
              </select>
            </div>
            {(brandVoice.primaryIndustry === "other" ||
              brandVoice.primaryIndustry === "health_fitness" ||
              brandVoice.primaryIndustry === "real_estate" ||
              brandVoice.primaryIndustry === "creative_services" ||
              brandVoice.primaryIndustry === "tech_startups") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Niche (describe your client&apos;s business)
                </label>
                <input
                  type="text"
                  value={brandVoice.nicheDescription || ""}
                  onChange={(e) =>
                    setBrandVoice({
                      ...brandVoice,
                      nicheDescription: e.target.value,
                      niche: "custom",
                    })
                  }
                  placeholder="e.g. Online Fitness Coach for Women, Real Estate Agent in Lagos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will generate tailored content ideas for this niche
                </p>
              </div>
            )}
            {brandVoice.primaryIndustry &&
              !["other", "health_fitness", "real_estate", "creative_services", "tech_startups"].includes(
                brandVoice.primaryIndustry
              ) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Niche (optional – e.g. Jollof specialist, Wedding cakes)
                </label>
                <input
                  type="text"
                  value={brandVoice.nicheDescription || ""}
                  onChange={(e) =>
                    setBrandVoice({ ...brandVoice, nicheDescription: e.target.value })
                  }
                  placeholder="Optional: narrow down for better ideas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              Powers content ideas for this client. Custom niches get AI-generated ideas.
            </p>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={brandVoice.tone || ""}
              onChange={(e) => setBrandVoice({ ...brandVoice, tone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              <option value="">Select tone</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="funny">Funny</option>
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          {/* Slang Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nigerian Slang Level
            </label>
            <select
              value={brandVoice.slangLevel || "none"}
              onChange={(e) => setBrandVoice({ ...brandVoice, slangLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How much Nigerian slang/Pidgin to use in content
            </p>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={brandVoice.industry || ""}
              onChange={(e) => setBrandVoice({ ...brandVoice, industry: e.target.value })}
              placeholder="e.g., Food & Beverage, Fashion, Tech"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Do's */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do&apos;s (What to include)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDo}
                  onChange={(e) => setNewDo(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addItem("do")}
                  placeholder="Add a do..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <Button
                  type="button"
                  onClick={() => addItem("do")}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(brandVoice.dos || []).map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200"
                  >
                    {item}
                    <button
                      onClick={() => removeItem("do", index)}
                      className="hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Don'ts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Don&apos;ts (What to avoid)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDont}
                  onChange={(e) => setNewDont(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addItem("dont")}
                  placeholder="Add a don't..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <Button
                  type="button"
                  onClick={() => addItem("dont")}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(brandVoice.donts || []).map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-200"
                  >
                    {item}
                    <button
                      onClick={() => removeItem("dont", index)}
                      className="hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Preferred Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Hashtags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addItem("hashtag")}
                  placeholder="Add hashtag (without #)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <Button
                  type="button"
                  onClick={() => addItem("hashtag")}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(brandVoice.preferredHashtags || []).map((hashtag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200"
                  >
                    #{hashtag}
                    <button
                      onClick={() => removeItem("hashtag", index)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Banned Words */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banned Words
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addItem("bannedWord")}
                  placeholder="Add banned word..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                <Button
                  type="button"
                  onClick={() => addItem("bannedWord")}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(brandVoice.bannedWords || []).map((word, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-300"
                  >
                    {word}
                    <button
                      onClick={() => removeItem("bannedWord", index)}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Brand Voice
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
