"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RouteTransition } from "@/components/RouteTransition";
import { Logo } from "@/components/Logo";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useUser();
  const { resolvedTheme } = useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isMobile, setIsMobile] = useState(false);
  
  const isDark = resolvedTheme === "dark";

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Listen for sidebar width changes
  useEffect(() => {
    const handleSidebarChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ width: number }>;
      if (customEvent.detail?.width !== undefined) {
        setSidebarWidth(customEvent.detail.width);
      }
    };
    window.addEventListener("sidebar-width-change", handleSidebarChange);
    return () => {
      window.removeEventListener("sidebar-width-change", handleSidebarChange);
    };
  }, []);

  // Show loading ONLY while Clerk is loading
  // Trust middleware - if user got here, they're authenticated (middleware checked server-side)
  if (!isLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-900" : "bg-white"
      }`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4">
              <Logo size="2xl" variant="square" />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}>
            Loading Revvy...
          </h2>
          <p className={`mb-6 ${
            isDark ? "text-slate-400" : "text-gray-600"
          }`}>
            Please wait while we load your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Render dashboard - middleware already verified auth server-side
  // Don't check isSignedIn here - it causes race conditions
  // If middleware allowed access, user IS authenticated
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? "bg-slate-900" : "bg-white"
    }`}>
      <RouteTransition />
      <DashboardSidebar onWidthChange={(width) => setSidebarWidth(width)} />
      <main 
        className={`transition-all duration-200 min-h-screen transition-colors ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
        style={{ 
          marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
        }}
      >
        <DashboardHeader />
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
