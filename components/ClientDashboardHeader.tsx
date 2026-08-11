"use client";

import { useClerk } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ClientDashboardHeaderProps {
  clientId: number;
}

export function ClientDashboardHeader({ clientId }: ClientDashboardHeaderProps) {
  const { signOut } = useClerk();
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    fetch(`/api/client/${clientId}/dashboard`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.clientName) setClientName(data.clientName);
      })
      .catch(() => {});
  }, [clientId]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0b1220]/75 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size="sm" variant="full" forceDark />
          <div className="hidden sm:block h-5 w-px bg-white/15" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/70 font-semibold">
              Client portal
            </p>
            <h1 className="text-sm font-semibold text-white truncate">
              {clientName || "Your workspace"}
            </h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="rounded-xl text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
        >
          <LogOut className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
