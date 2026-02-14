"use client";

import { Logo } from "./Logo";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingScreen({ 
  message = "Loading...", 
  subtitle,
  size = "lg"
}: LoadingScreenProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const logoSize = size === "sm" ? "xl" : size === "md" ? "2xl" : "2xl";

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4">
            <Logo size={logoSize as "sm" | "md" | "lg" | "xl" | "2xl"} variant="square" />
          </div>
        </div>
        {message && (
          <h2 className={`text-xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-950"
          }`}>
            {message}
          </h2>
        )}
        {subtitle && (
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
