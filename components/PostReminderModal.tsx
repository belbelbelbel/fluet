"use client";

import { useState, useEffect } from "react";
import { XIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

interface PostReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: number;
    platform: string;
    content: string;
    scheduledFor: string;
  } | null;
}

export function PostReminderModal({ isOpen, onClose, post }: PostReminderModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!isOpen || !post) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      showToast.success("Copied!", "Content copied to clipboard");
    } catch {
      showToast.error("Failed to copy", "Please try again");
    }
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      twitter: "Twitter",
      instagram: "Instagram",
      linkedin: "LinkedIn",
      tiktok: "TikTok",
      youtube: "YouTube",
    };
    return names[platform.toLowerCase()] || platform;
  };

  const getPlatformUrl = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: "https://twitter.com/compose/tweet",
      instagram: "https://www.instagram.com/",
      linkedin: "https://www.linkedin.com/feed/",
      tiktok: "https://www.tiktok.com/upload",
      youtube: "https://studio.youtube.com/",
    };
    return urls[platform.toLowerCase()] || "#";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-950"}`}>
              Time to Post on {getPlatformName(post.platform)}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Scheduled for {formatDate(post.scheduledFor)}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <XIcon className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
              Your Content (Ready to Copy)
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={post.content}
                className={`w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isDark ? "border-slate-600 bg-slate-700 text-white placeholder-slate-500" : "border-gray-300 bg-gray-50 text-gray-900"
                }`}
              />
              <button
                onClick={handleCopy}
                className={`absolute top-3 right-3 p-2 border rounded-lg transition-colors ${isDark ? "bg-slate-700 border-slate-600 hover:bg-slate-600" : "bg-white border-gray-300 hover:bg-gray-50"}`}
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckIcon className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
                ) : (
                  <CopyIcon className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-gray-600"}`} />
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className={`rounded-lg p-4 mb-6 border ${isDark ? "bg-purple-900/30 border-purple-800" : "bg-purple-50 border-purple-200"}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-purple-300" : "text-purple-900"}`}>
              How to Post:
            </h3>
            <ol className={`text-sm space-y-1 list-decimal list-inside ${isDark ? "text-purple-200" : "text-purple-800"}`}>
              <li>Click &quot;Copy&quot; to copy your content</li>
              <li>Click &quot;Open {getPlatformName(post.platform)}&quot; to go to the platform</li>
              <li>Paste your content and post</li>
              <li>Come back and mark as posted</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy Content
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                window.open(getPlatformUrl(post.platform), "_blank");
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Open {getPlatformName(post.platform)}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t rounded-b-2xl ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
          <p className={`text-xs text-center ${isDark ? "text-slate-400" : "text-gray-600"}`}>
            Tip: Connect your {getPlatformName(post.platform)} account in Settings to enable auto-posting
          </p>
        </div>
      </div>
    </div>
  );
}
