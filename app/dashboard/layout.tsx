"use client";

import { Suspense } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { RouteTransition } from "@/components/RouteTransition";
import { LoadingScreen } from "@/components/LoadingScreen";
import { DashboardAuthGate } from "@/components/DashboardAuthGate";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isMobile, setIsMobile] = useState(false);

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

  // Keep dashboard shell visible; only gate page content while Clerk loads
  return (
    <div className="min-h-dvh bg-background transition-colors duration-300">
      <RouteTransition />
      <DashboardSidebar onWidthChange={(width) => setSidebarWidth(width)} />
      <main
        className="min-h-dvh bg-background transition-all duration-200"
        style={{ 
          marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
        }}
      >
        <DashboardHeader />
        <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-0 overflow-x-hidden">
          <Suspense
            fallback={
              <LoadingScreen
                variant="inline"
                message="Loading Revvy..."
                subtitle="Please wait..."
              />
            }
          >
            <DashboardAuthGate>{children}</DashboardAuthGate>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
