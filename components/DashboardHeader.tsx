"use client";

import { ClientSelector } from "@/components/ClientSelector";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { userId } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const pathClientId = pathname.match(/\/dashboard\/clients\/(\d+)/)?.[1];
  const currentClientId = pathClientId ? parseInt(pathClientId) : null;

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 pr-14 sm:pr-6 lg:pr-8">
        <ClientSelector
          userId={userId}
          selectedClientId={currentClientId || selectedClientId}
          onClientChange={(clientId) => {
            setSelectedClientId(clientId);
            if (clientId && currentClientId !== clientId) {
              window.location.href = `/dashboard/clients/${clientId}`;
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
