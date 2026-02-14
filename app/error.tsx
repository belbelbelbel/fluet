"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isExtensionError, setIsExtensionError] = useState(false);

  useEffect(() => {
    // Check if error is from a browser extension
    const extensionError = 
      (error as any)?.reqInfo?.pathPrefix === "/writing" ||
      (error as any)?.reqInfo?.path === "/get_template_list" ||
      error?.message?.includes("permission error") ||
      (error as any)?.error === "exceptions.UserAuthError" ||
      (error as any)?.code === 403 ||
      (error?.stack && error.stack.includes("background.js"));

    if (extensionError) {
      // If it's an extension error, just reset and continue
      console.warn("[Error Boundary] Ignoring browser extension error, resetting...");
      setIsExtensionError(true);
      // Auto-reset after a short delay
      setTimeout(() => {
        reset();
      }, 100);
      return;
    }

    console.error("Application error:", error);
  }, [error, reset]);

  // Don't show error UI for extension errors (they'll be auto-reset)
  if (isExtensionError) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="text-center">
          <div className={`w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <p className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDark ? "bg-slate-900" : "bg-white"}`}>
      <div className="max-w-md w-full text-center">
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-red-400" : "text-red-600"}`}>
          Something went wrong!
        </h2>
        <p className={`mb-6 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="space-y-4">
          <Button
            onClick={reset}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded transition-colors"
          >
            Try again
          </Button>
          <div>
            <a
              href="/"
              className={`${isDark ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"} underline transition-colors`}
            >
              Go back home
            </a>
          </div>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className={`cursor-pointer mb-2 ${isDark ? "text-slate-400" : "text-gray-600"}`}>
              Error Details (Development Only)
            </summary>
            <pre className={`p-4 rounded text-xs overflow-auto ${isDark ? "bg-slate-800 text-slate-300" : "bg-gray-100 text-gray-800"}`}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

