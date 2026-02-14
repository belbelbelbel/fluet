"use client";

// import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  BarChart3,
  History,
  Calendar,
  Menu,
  X,
  SquareMinus,
  Lightbulb,
  Layers,
  Settings,
  Users,
  LogOut,
  FileText,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
// Navigation organized into sections - Updated structure
const navigationSections = [
  {
    heading: "MAIN",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Clients", href: "/dashboard/clients", icon: Building2 },
    ],
  },
  {
    heading: "CONTENT",
    items: [
      { name: "Generate", href: "/dashboard/generate", icon: SquareMinus },
      { name: "Content Ideas", href: "/dashboard/content-ideas", icon: Lightbulb },
      { name: "Post Stack", href: "/dashboard/post-stack", icon: Layers },
      { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
      { name: "History", href: "/dashboard/history", icon: History },
    ],
  },
  {
    heading: "INSIGHTS",
    items: [
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Reports", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    heading: "MANAGE",
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
  const { resolvedTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  
  const isDark = resolvedTheme === "dark";

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

  // Prefetch routes on hover for faster navigation (lazy prefetch)
  // This prevents blocking initial page load
  const handleMouseEnter = (href: string) => {
    router.prefetch(href);
  };

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
      // Close mobile menu immediately
      if (isMobile) {
        setIsMobileOpen(false);
      }
      // Navigate immediately - no delay
      router.push(href);
      // Clear navigating state quickly
      setTimeout(() => setNavigatingTo(null), 100);
    }
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={`fixed top-4 right-4 z-50 p-2 border rounded-lg shadow-lg transition-colors lg:hidden ${
            isDark
              ? "bg-black border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-900"
              : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
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
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r shadow-lg transition-all duration-300 ease-in-out w-64",
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0"
        )}
      >
      <div className="flex h-full flex-col">
        {/* Branding - Top */}
        <div className={`flex h-16 items-center px-4 border-b ${
          isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"
        }`}>
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <Logo size="lg" variant="icon" />
            <span className={`text-lg font-bold ${
              isDark ? "text-white" : "text-gray-950"
            }`}>Revvy</span>
          </button>
        </div>

        <nav className={`flex-1 space-y-6 px-3 py-4 overflow-y-auto ${
          isDark ? "bg-slate-800" : "bg-white"
        }`}>
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.heading && (
                <div className="px-3 mb-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}>
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
                      onMouseEnter={() => handleMouseEnter(item.href)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-left",
                        isActive
                          ? isDark
                            ? "bg-purple-950/50 text-purple-300 font-semibold"
                            : "bg-purple-50 text-purple-700 font-semibold"
                          : isDark
                          ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
                        isNavigating && "opacity-50 cursor-wait"
                      )}
                      disabled={isNavigating}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          isActive
                            ? isDark ? "text-purple-300" : "text-purple-700"
                            : isDark ? "text-gray-500 group-hover:text-white" : "text-gray-500 group-hover:text-gray-950",
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
        <div className={`border-t px-3 py-4 ${
          isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
              {user?.firstName?.[0] || user?.fullName?.[0] || "U"}
              {user?.lastName?.[0] || ""}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                {user?.fullName || user?.firstName || "User"}
                {user?.lastName && !user?.fullName ? ` ${user.lastName}` : ""}
              </div>
              <div className={`text-xs truncate ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}>
                {user?.primaryEmailAddress?.emailAddress || "email@example.com"}
              </div>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className={`p-1.5 transition-colors rounded-lg ${
                isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
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