"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
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
            ("bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"),
          isYellow &&
            ("bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200")
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
                  isRed && ("text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"),
                  isYellow && ("text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200")
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
          "text-red-600 dark:text-red-300"
        )}>
          Some actions are blocked until this is resolved.
        </p>
      )}
    </div>
  );
}
