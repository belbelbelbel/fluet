"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToaster() {
  const { resolvedTheme } = useTheme();
  
  return (
    <Toaster 
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
