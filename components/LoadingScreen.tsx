"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/contexts/ThemeContext";

const LoadingLottie = dynamic(
  () => import("./LoadingLottie").then((mod) => mod.LoadingLottie),
  {
    ssr: false,
    loading: () => <LoadingSpinnerFallback size={72} />,
  }
);

function LoadingSpinnerFallback({ size = 72 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-gray-200 border-t-gray-700 dark:border-slate-600 dark:border-t-slate-300 animate-spin"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

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

  const minHeight =
    variant === "fullscreen" ? "100dvh" : "calc(100dvh - 7rem)";

  return (
    <div
      className={`w-full flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        width: "100%",
        fontFamily: "var(--font-nunito), Nunito, sans-serif",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="text-center max-w-sm mx-auto px-4"
        style={{ textAlign: "center", maxWidth: "24rem", margin: "0 auto", padding: "0 1rem" }}
      >
        <div
          className="flex flex-col items-center justify-center mb-4"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <LoadingLottie size={lottieSize} />
        </div>
        {message && (
          <h2
            className={`text-base sm:text-lg font-medium mb-1 ${
              isDark ? "text-white" : "text-gray-950"
            }`}
            style={{
              fontSize: "1.125rem",
              fontWeight: 500,
              marginBottom: "0.25rem",
              color: isDark ? "#fff" : "#030712",
            }}
          >
            {message}
          </h2>
        )}
        {subtitle && (
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}
            style={{
              fontSize: "0.875rem",
              color: isDark ? "#94a3b8" : "#6b7280",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
