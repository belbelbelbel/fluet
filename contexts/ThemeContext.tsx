"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Marketing home stays light — dark mode is for the app shell only. */
function isLandingPath(pathname?: string | null): boolean {
  if (typeof window === "undefined") return false;
  const path = pathname ?? window.location.pathname;
  return path === "/" || path === "";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply theme changes (landing path never gets .dark on <html>)
  const applyTheme = (newTheme: Theme) => {
    // "system" deliberately resolves to light rather than following the OS.
    // Only the settings page has real dark styling — the rest of the dashboard
    // has almost no `dark:` variants — so honouring an OS dark preference made
    // settings render dark while every other page stayed white. Dark is
    // opt-in until the rest of the app is themed.
    const resolved: "light" | "dark" = newTheme === "dark" ? "dark" : "light";

    setResolvedTheme(resolved);

    const root = document.documentElement;
    if (resolved === "dark" && !isLandingPath()) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("app-theme", newTheme);
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme | null;
    const initialTheme = savedTheme || "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Re-apply when leaving/entering landing (Next client navigations)
  useEffect(() => {
    const reapply = () => applyTheme(theme);
    window.addEventListener("popstate", reapply);
    // Next.js App Router fires this on client navigations
    window.addEventListener("next-route-change", reapply as EventListener);

    const { pushState, replaceState } = window.history;
    window.history.pushState = function (...args) {
      const result = pushState.apply(this, args);
      reapply();
      return result;
    };
    window.history.replaceState = function (...args) {
      const result = replaceState.apply(this, args);
      reapply();
      return result;
    };

    return () => {
      window.removeEventListener("popstate", reapply);
      window.removeEventListener("next-route-change", reapply as EventListener);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // No OS-preference listener: "system" resolves to light (see applyTheme).

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
