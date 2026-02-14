"use client";

import { TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreditsWarningBannerProps {
  clientName: string;
  postsUsed: number;
  postsPerMonth: number;
  percentageUsed: number;
  isExceeded: boolean;
  onDismiss?: () => void;
}

export function CreditsWarningBanner({
  clientName,
  postsUsed,
  postsPerMonth,
  percentageUsed,
  isExceeded,
  onDismiss,
}: CreditsWarningBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  if (isExceeded) {
    return (
      <div className="sticky top-0 z-40 border-b bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <TrendingUp className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  🚫 Credits exceeded for {clientName} ({postsUsed}/{postsPerMonth} used)
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                  Upgrade your plan to continue generating content
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Upgrade Plan
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-black/10 text-red-600 dark:text-red-400"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 80% warning
  return (
    <div className="sticky top-0 z-40 border-b bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <TrendingUp className="w-5 h-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                📊 Credits at {Math.round(percentageUsed)}% for {clientName} ({postsUsed}/{postsPerMonth} used)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpgrade}
              size="sm"
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
            >
              Upgrade Plan
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-black/10 text-yellow-600 dark:text-yellow-400"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
