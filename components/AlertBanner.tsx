"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export type BannerVariant = "payment_overdue" | "credits_warning" | "credits_exceeded";

export interface AlertBannerItem {
  id: string;
  variant: BannerVariant;
  message: string;
  clientName?: string;
  link?: string;
}

interface AlertBannerProps {
  items: AlertBannerItem[];
  /** When true, actions like generate/schedule should be blocked (hard block) */
  blockActions?: boolean;
  className?: string;
}

export function AlertBanner({ items, blockActions, className }: AlertBannerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOverdue = item.variant === "payment_overdue";
        const isExceeded = item.variant === "credits_exceeded";
        const isWarning = item.variant === "credits_warning";

        const isRed = isOverdue || isExceeded;
        const isYellow = isWarning;

        const wrapperClass = cn(
          "rounded-lg border p-3 flex items-center gap-3",
          isRed &&
            (isDark
              ? "bg-red-950/40 border-red-800 text-red-200"
              : "bg-red-50 border-red-200 text-red-800"),
          isYellow &&
            (isDark
              ? "bg-amber-950/40 border-amber-800 text-amber-200"
              : "bg-amber-50 border-amber-200 text-amber-800")
        );

        const Icon = isRed ? AlertCircle : AlertTriangle;

        return (
          <div key={item.id} className={wrapperClass}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{item.message}</p>
            {item.link && (
              <a
                href={item.link}
                className={cn(
                  "text-sm font-medium underline underline-offset-2",
                  isRed && (isDark ? "text-red-300 hover:text-red-200" : "text-red-700 hover:text-red-800"),
                  isYellow && (isDark ? "text-amber-300 hover:text-amber-200" : "text-amber-700 hover:text-amber-800")
                )}
              >
                View
              </a>
            )}
          </div>
        );
      })}
      {blockActions && (
        <p className={cn(
          "text-xs px-3",
          isDark ? "text-red-300" : "text-red-600"
        )}>
          Some actions are blocked until this is resolved.
        </p>
      )}
    </div>
  );
}
