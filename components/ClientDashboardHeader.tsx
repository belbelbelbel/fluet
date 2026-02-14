"use client";

import { useClerk } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";

interface ClientDashboardHeaderProps {
  clientId: number;
}

export function ClientDashboardHeader({ clientId }: ClientDashboardHeaderProps) {
  const { signOut } = useClerk();
  const { resolvedTheme } = useTheme();
  const [clientName, setClientName] = useState<string>("");
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    // Fetch client name
    fetch(`/api/clients/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setClientName(data.name);
      })
      .catch(() => {});
  }, [clientId]);

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors ${
      isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" variant="icon" />
          <h1 className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            {clientName || "Client Dashboard"}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectUrl: "/" })}
          className={isDark 
            ? "text-gray-400 hover:text-white" 
            : "text-gray-600 hover:text-gray-900"
          }
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
