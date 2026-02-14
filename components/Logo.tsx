"use client";

import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  className?: string;
  variant?: "icon" | "full" | "square";
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  "2xl": 96,
};

export function Logo({ 
  size = "md", 
  showText = false, 
  className = "",
  variant = "icon"
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the correct size to prevent layout shift
    const logoSize = sizeMap[size];
    return (
      <div 
        className={`flex items-center gap-2 ${className}`}
        style={{ width: logoSize, height: logoSize }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const logoSize = sizeMap[size];

  let logoSrc = "/images/Revvylogo/logo-icon.png";
  
  if (variant === "icon") {
    logoSrc = isDark 
      ? "/images/Revvylogo/logo-icon-dark-transparent.png"
      : "/images/Revvylogo/logo-icon.png";
  } else if (variant === "full") {
    logoSrc = isDark
      ? "/images/Revvylogo/logo-dark-transparent.png"
      : "/images/Revvylogo/logo-light-transparent.png";
  } else if (variant === "square") {
    logoSrc = "/images/Revvylogo/logo-2-square.png";
  }

  // Make dark mode logo smaller to match light mode visual size
  const effectiveSize = isDark && variant === "full" ? Math.max(logoSize - 8, sizeMap.md) : logoSize;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="flex-shrink-0 flex items-center justify-center"
        style={{ 
          width: effectiveSize, 
          height: effectiveSize,
          maxWidth: effectiveSize,
          maxHeight: effectiveSize
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
            width: 'auto',
            height: 'auto'
          }}
          priority
        />
      </div>
      {showText && (
        <span className={`text-lg font-bold ${
          isDark ? "text-white" : "text-gray-950"
        }`}>
          Revvy
        </span>
      )}
    </div>
  );
}
