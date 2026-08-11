import type { Appearance } from "@clerk/types";

export const clerkAuthAppearance: Appearance = {
  elements: {
    rootBox: "mx-auto w-full",
    card: "shadow-none border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800",
    headerTitle: "text-gray-950 dark:text-white font-medium",
    headerSubtitle: "text-gray-600 dark:text-slate-400",
    socialButtonsBlockButton:
      "border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700",
    formFieldInput:
      "border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white",
    formButtonPrimary:
      "bg-gray-950 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 normal-case text-sm font-medium",
    footerActionLink: "text-gray-900 dark:text-white hover:underline font-medium",
    identityPreviewEditButton: "text-gray-700 dark:text-slate-300",
    formFieldLabel: "text-gray-700 dark:text-slate-300",
    dividerLine: "bg-gray-200 dark:bg-slate-600",
    dividerText: "text-gray-500 dark:text-slate-400",
  },
};
