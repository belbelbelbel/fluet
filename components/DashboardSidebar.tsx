"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  Wand2,
  History,
  Calendar,
  PenTool,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate", href: "/dashboard/generate", icon: Wand2 },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  onWidthChange?: (width: number) => void;
}

export function DashboardSidebar({ onWidthChange }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notify parent of width changes
  useEffect(() => {
    const width = isCollapsed ? 80 : 256;
    onWidthChange?.(width);
  }, [isCollapsed, onWidthChange]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-gray-800 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <div className="relative">
                <PenTool className="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold text-white">Fluet AI</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <PenTool className="w-6 h-6 text-blue-500" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
                  )}
                />
                {!isCollapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {!isCollapsed && (
          <div className="border-t border-gray-800 p-4">
            <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1">Account</p>
              <p className="text-sm font-medium text-white truncate">
                {userId ? "Pro Account" : "Free Account"}
              </p>
              <p className="text-xs text-gray-400 mt-1">Manage subscription</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

