"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Listen for sidebar width changes
  useEffect(() => {
    const handleSidebarChange = (e: CustomEvent) => {
      setSidebarWidth(e.detail.width);
    };
    window.addEventListener("sidebar-width-change" as any, handleSidebarChange);
    return () => {
      window.removeEventListener("sidebar-width-change" as any, handleSidebarChange);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <DashboardSidebar onWidthChange={(width) => setSidebarWidth(width)} />
      <main 
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

