"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RouteTransition } from "@/components/RouteTransition";
import { LoadingScreen } from "@/components/LoadingScreen";
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
      <LoadingScreen
        message="Loading Revvy..."
        subtitle="Please wait while we load your dashboard..."
      />
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
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
