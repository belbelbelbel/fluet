"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";

const toastBase =
  "!flex !items-start !gap-3 !w-[var(--width)] !max-w-[360px] !p-3.5 !pr-9 !rounded-md !shadow-none !font-[inherit] !bg-card !text-card-foreground !border-[0.5px] !border-border/80";

const toastTitle =
  "!text-sm !font-medium !text-foreground !leading-snug";

const toastDescription =
  "!text-xs !text-muted-foreground !leading-relaxed !mt-0.5";

export function ThemeToaster() {
  // Sonner renders in a portal outside the themed tree, so it cannot inherit
  // `.dark` from <html>. It needs the resolved value passed explicitly.
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme}
      closeButton
      gap={8}
      offset={16}
      visibleToasts={4}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: toastBase,
          title: toastTitle,
          description: toastDescription,
          closeButton:
            "!absolute !top-3 !right-2.5 !left-auto !transform-none !border-0 !bg-transparent !text-muted-foreground hover:!text-foreground !rounded-sm !p-0 !size-4 !opacity-60 hover:!opacity-100 !transition-opacity",
          icon: "!size-4 !shrink-0 !mt-px",
          success: "",
          error: "",
          warning: "",
          info: "",
          loading: "",
        },
      }}
      icons={{
        success: (
          <CheckCircle2
            className="size-4 text-emerald-600 dark:text-emerald-400"
            strokeWidth={1.75}
          />
        ),
        error: (
          <XCircle
            className="size-4 text-red-600 dark:text-red-400"
            strokeWidth={1.75}
          />
        ),
        info: (
          <Info
            className="size-4 text-muted-foreground"
            strokeWidth={1.75}
          />
        ),
        warning: (
          <AlertCircle
            className="size-4 text-amber-600 dark:text-amber-400"
            strokeWidth={1.75}
          />
        ),
        loading: (
          <Loader2
            className="size-4 text-muted-foreground animate-spin"
            strokeWidth={1.75}
          />
        ),
      }}
    />
  );
}
