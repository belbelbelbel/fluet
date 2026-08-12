"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";

interface FeatureComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  compact?: boolean;
}

export function FeatureComingSoon({
  title,
  description,
  icon: Icon = BarChart3,
  compact = false,
}: FeatureComingSoonProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl border ${
        compact ? "py-8 px-4" : "py-12 sm:py-16 px-6"
      } ${
        "bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-slate-700"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full mb-4 ${
          compact ? "w-12 h-12" : "w-16 h-16 sm:w-20 sm:h-20"
        } ${"bg-white border border-gray-200 dark:bg-slate-800"}`}
      >
        <Icon
          className={`${compact ? "w-6 h-6" : "w-8 h-8 sm:w-10 sm:h-10"} ${
            "text-foreground dark:text-purple-400"
          }`}
        />
      </div>
      <p
        className={`font-semibold mb-2 ${compact ? "text-sm" : "text-base sm:text-lg"} text-foreground`}
      >
        {title}
      </p>
      <p
        className={`max-w-md text-sm leading-relaxed text-muted-foreground`}
      >
        {description}
      </p>
    </div>
  );
}
