"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PaymentWarningBannerProps {
  type: "agency" | "client";
  status: "overdue" | "warning";
  message: string;
  daysRemaining?: number;
  clientName?: string;
  onDismiss?: () => void;
}

export function PaymentWarningBanner({
  type,
  status,
  message,
  daysRemaining,
  clientName,
  onDismiss,
}: PaymentWarningBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isOverdue = status === "overdue";
  const isAgency = type === "agency";

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleRenew = () => {
    router.push("/pricing");
  };

  return (
    <div
      className={`sticky top-0 z-40 border-b ${
        isOverdue
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle
              className={`w-5 h-5 flex-shrink-0 ${
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  isOverdue
                    ? "text-red-800 dark:text-red-200"
                    : "text-yellow-800 dark:text-yellow-200"
                }`}
              >
                {message}
                {daysRemaining !== undefined && daysRemaining > 0 && (
                  <span className="ml-1">
                    ({daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOverdue && isAgency && (
              <Button
                onClick={handleRenew}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Renew Subscription
              </Button>
            )}
            <button
              onClick={handleDismiss}
              className={`p-1 rounded hover:bg-black/10 ${
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
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
