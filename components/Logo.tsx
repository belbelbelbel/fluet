"use client";

import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  className?: string;
  variant?: "icon" | "full" | "square";
  /** Preload above-the-fold logos (navbar, hero). Default true. */
  priority?: boolean;
  /** Always use the light logo asset (marketing/landing). */
  forceLight?: boolean;
  /** Always use the dark-surface logo asset (white mark on dark UIs). */
  forceDark?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  "2xl": 96,
};

function getLogoSrc(variant: LogoProps["variant"], isDark: boolean) {
  // A CSS `dark:` variant cannot swap an <img> src, so this stays a JS branch
  // on the resolved theme rather than moving to a token/variant.
  //
  // The filenames describe the INK, not the background they belong on:
  //   *-light-transparent = white ink   -> only legible on a dark surface
  //   *-dark-transparent  = purple ink  -> legible on white and on the canvas
  // These were wired the other way round, so the light theme served the white
  // mark and the logo was invisible against the white navbar.
  //
  // logo-icon.png is not an option for either: it is baked onto a solid white
  // square and shows as a white box on any tinted surface.
  if (variant === "icon") {
    return isDark
      ? "/images/Revvylogo/logo-icon-light-transparent.png"
      : "/images/Revvylogo/logo-icon-dark-transparent.png";
  }
  if (variant === "full") {
    return isDark
      ? "/images/Revvylogo/logo-light-transparent.png"
      : "/images/Revvylogo/logo-dark-transparent.png";
  }
  return "/images/Revvylogo/logo-2-square.png";
}

export function Logo({
  size = "md",
  showText = false,
  className = "",
  variant = "icon",
  priority = true,
  forceLight = false,
  forceDark = false,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSize = sizeMap[size];
  // SSR + first paint: light logo so Next/Image can preload immediately
  const isDark = forceDark
    ? true
    : !forceLight && mounted && resolvedTheme === "dark";
  const logoSrc = getLogoSrc(variant, isDark);
  const effectiveSize =
    isDark && variant === "full" ? Math.max(logoSize - 8, sizeMap.md) : logoSize;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: effectiveSize,
          height: effectiveSize,
          maxWidth: effectiveSize,
          maxHeight: effectiveSize,
        }}
      >
        <Image
          src={logoSrc}
          alt="Revvy Logo"
          width={effectiveSize}
          height={effectiveSize}
          className="object-contain w-full h-full"
          style={{
            maxWidth: effectiveSize,
            maxHeight: effectiveSize,
            width: "auto",
            height: "auto",
          }}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>
      {showText && (
        <span
          className={`text-lg font-bold text-foreground`}
        >
          Revvy
        </span>
      )}
    </div>
  );
}
