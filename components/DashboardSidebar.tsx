"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  History,
  Calendar,
  PenTool,
  Menu,
  X,
  SquareMinus,
  Lightbulb,
  Layers,
  Settings,
  Users,
  LogOut,
  Sparkles,
  BookOpen,
  Plug,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
// Navigation organized into sections
const navigationSections = [
  {
    // No heading for first section
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Content Ideas", href: "/dashboard/content-ideas", icon: Lightbulb },
      { name: "Post Stack", href: "/dashboard/post-stack", icon: Layers },
      { name: "Generate", href: "/dashboard/generate", icon: SquareMinus },
    ],
  },
  {
    heading: "AUTOMATION",
    items: [
      { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
      { name: "History", href: "/dashboard/history", icon: History },
    ],
  },
  {
    heading: "INSIGHTS",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    heading: "SETTINGS",
    items: [
      { name: "Team", href: "/dashboard/team", icon: Users },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

interface DashboardSidebarProps {
  onWidthChange?: (width: number) => void;
}

export function DashboardSidebar({ onWidthChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; 
      setIsMobile(mobile);
      if (mobile) {
        onWidthChange?.(0);
      } else {
        onWidthChange?.(256);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [onWidthChange]);

  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [pathname, isMobile]);

  const { user } = useUser();
  const { signOut } = useClerk();

  // Prefetch all routes on mount for instant navigation
  useEffect(() => {
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        router.prefetch(item.href);
      });
    });
  }, [router]);

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
      // Close mobile menu immediately
      if (isMobile) {
        setIsMobileOpen(false);
      }
      // Navigate
      router.push(href);
      // Clear navigating state after a short delay
      setTimeout(() => setNavigatingTo(null), 300);
    }
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 right-4 z-50 p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      )}

      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out w-64",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0"
        )}
      >
      <div className="flex h-full flex-col">
        {/* Branding - Top */}
        <div className="flex h-16 items-center px-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-950">Flippr AI</span>
          </button>
        </div>

        <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto bg-white">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.heading && (
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {section.heading}
                  </h3>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  // Dashboard should only be active on exact match, others can match sub-routes
                  const isActive = item.href === "/dashboard" 
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  const isNavigating = navigatingTo === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-left",
                        isActive
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
                        isNavigating && "opacity-50 cursor-wait"
                      )}
                      disabled={isNavigating}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          isActive ? "text-purple-700" : "text-gray-500 group-hover:text-gray-950",
                          isNavigating && "animate-pulse"
                        )}
                      />
                      <span className="flex-1">{item.name}</span>
                      {isNavigating && (
                        <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Section - Bottom */}
        <div className="border-t border-gray-200 px-3 py-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
              {user?.firstName?.[0] || user?.fullName?.[0] || "U"}
              {user?.lastName?.[0] || ""}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || user?.firstName || "User"}
                {user?.lastName && !user?.fullName ? ` ${user.lastName}` : ""}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.primaryEmailAddress?.emailAddress || "email@example.com"}
              </div>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </aside>
    </>
  );
}