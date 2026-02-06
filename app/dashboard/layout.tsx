"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { RouteTransition } from "@/components/RouteTransition";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
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

  // Show auth buttons while loading or not signed in
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {!isLoaded && (
            <Loader2 className="w-8 h-8 text-gray-950 animate-spin mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {!isLoaded ? "Loading..." : "Sign in to continue"}
          </h2>
          <p className="text-gray-600 mb-6">
            {!isLoaded 
              ? "Please wait while we load your dashboard..."
              : "Please sign in to access your dashboard"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignInButton mode="modal">
              <Button className="w-full sm:w-auto bg-gray-950 hover:bg-gray-900 text-white px-6 py-3 shadow-md">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3">
                Sign up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RouteTransition />
      <DashboardSidebar onWidthChange={(width) => setSidebarWidth(width)} />
      <main 
        className="transition-all duration-200 min-h-screen bg-white"
        style={{ 
          marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
        }}
      >
        <div className="h-full w-full px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

