"use client";

import { ClientSelector } from "@/components/ClientSelector";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Extract client ID from pathname if on client-specific page
  const pathClientId = pathname.match(/\/dashboard\/clients\/(\d+)/)?.[1];
  const currentClientId = pathClientId ? parseInt(pathClientId) : null;

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      // If system, toggle to opposite of current resolved theme
      setTheme(isDark ? "light" : "dark");
    }
  };

  return (
    <div className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
      isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"
    }`}>
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ClientSelector
              selectedClientId={currentClientId || selectedClientId}
              onClientChange={(clientId) => {
                setSelectedClientId(clientId);
                if (clientId) {
                  window.location.href = `/dashboard/clients/${clientId}`;
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`transition-colors ${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-neutral-900" 
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-100"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
