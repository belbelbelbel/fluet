"use client";

import { LoadingLottie } from "./LoadingLottie";
import { useTheme } from "@/contexts/ThemeContext";

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  /** fullscreen = auth gate; inline = page/content area inside dashboard shell */
  variant?: "fullscreen" | "inline";
}

const lottieSizeMap = {
  sm: 56,
  md: 72,
  lg: 88,
};

export function LoadingScreen({
  message = "Loading...",
  subtitle,
  size = "lg",
  variant = "fullscreen",
}: LoadingScreenProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lottieSize = lottieSizeMap[size];

  const containerClass =
    variant === "fullscreen"
      ? "min-h-screen"
      : "min-h-[44vh] w-full py-12";

  return (
    <div
      className={`${containerClass} flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}
    >
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-4">
          <LoadingLottie size={lottieSize} />
        </div>
        {message && (
          <h2
            className={`text-base sm:text-lg font-semibold mb-1 ${
              isDark ? "text-white" : "text-gray-950"
            }`}
          >
            {message}
          </h2>
        )}
        {subtitle && (
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
