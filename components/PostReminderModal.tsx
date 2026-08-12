"use client";

import { useState, useEffect } from "react";
import { CopyIcon, CheckIcon, ExternalLinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkedPosted?: () => void;
  post: {
    id: number;
    platform: string;
    content: string;
    scheduledFor: string;
  } | null;
}

export function PostReminderModal({
  isOpen,
  onClose,
  onMarkedPosted,
  post,
}: PostReminderModalProps) {
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!post) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      showToast.success("Copied!", "Content copied to clipboard");
    } catch {
      showToast.error("Failed to copy", "Please try again");
    }
  };

  const handleMarkPosted = async () => {
    try {
      setMarking(true);
      const response = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: post.id, posted: true }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update");
      }
      showToast.success("Marked as posted", "This post moved to your history");
      onMarkedPosted?.();
      onClose();
    } catch (e) {
      showToast.error(
        "Couldn’t mark posted",
        e instanceof Error ? e.message : "Try again"
      );
    } finally {
      setMarking(false);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border dark:border-slate-600">
          <DialogTitle className="text-lg">
            Time to post on {getPlatformName(post.platform)}
          </DialogTitle>
          <DialogDescription>
            Scheduled for {formatDate(post.scheduledFor)}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/80 dark:text-slate-300">
              Your content
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={post.content}
                className="w-full h-32 p-4 border border-border dark:border-slate-600 rounded-lg resize-none bg-muted dark:bg-slate-900 text-foreground dark:text-white text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 border border-border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CopyIcon className="w-4 h-4 text-muted-foreground dark:text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg p-4 border border-border dark:border-slate-600 bg-muted dark:bg-slate-900/50">
            <h3 className="text-sm font-medium mb-2 text-foreground dark:text-slate-200">
              How to post
            </h3>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground dark:text-slate-400">
              <li>Copy your content above</li>
              <li>Open {getPlatformName(post.platform)} in a new tab</li>
              <li>Paste and publish</li>
              <li>Come back and mark as posted</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border dark:border-slate-600 flex-col sm:flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-xl">
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy content
                </>
              )}
            </Button>
            <Button
              onClick={() => window.open(getPlatformUrl(post.platform), "_blank")}
              className="flex-1 rounded-xl bg-gray-950 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 text-white"
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Open {getPlatformName(post.platform)}
            </Button>
          </div>
          <Button
            onClick={handleMarkPosted}
            disabled={marking}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {marking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckIcon className="w-4 h-4 mr-2" />
            )}
            Mark as posted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
