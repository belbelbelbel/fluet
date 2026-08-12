"use client";

import dynamic from "next/dynamic";

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
      className="rounded-full border-2 border-border border-t-foreground animate-spin"
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
  const lottieSize = lottieSizeMap[size];

  const minHeight =
    variant === "fullscreen" ? "100dvh" : "calc(100dvh - 7rem)";

  return (
    <div
      className="w-full flex items-center justify-center bg-background transition-colors duration-300"
      style={{
        // minHeight is the only genuinely dynamic value here; the rest is
        // expressed in classes so it stays themeable and responsive.
        minHeight,
        fontFamily: "var(--font-nunito), Nunito, sans-serif",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-4">
          <LoadingLottie size={lottieSize} />
        </div>
        {message && (
          <h2
            // No inline style: fontSize there defeated `text-base sm:text-lg`,
            // so this never scaled down on small screens.
            className="text-base sm:text-lg font-medium mb-1 text-foreground"
          >
            {message}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
