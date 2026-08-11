"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BarChart3,
  History,
  Calendar,
  Menu,
  X,
  Sparkles,
  Lightbulb,
  Layers,
  Settings,
  Users,
  LogOut,
  FileText,
  Building2,
  Inbox,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigationSections = [
  {
    heading: "MAIN",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Clients", href: "/dashboard/clients", icon: Building2 },
      { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    ],
  },
  {
    heading: "CONTENT",
    items: [
      { name: "Generate", href: "/dashboard/generate", icon: Sparkles },
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

function getInitials(first?: string | null, last?: string | null, full?: string | null) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() ?? "U";
  }
  if (first) return first.slice(0, 2).toUpperCase();
  return "U";
}

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
      onWidthChange?.(mobile ? 0 : 256);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [onWidthChange]);

  useEffect(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [pathname, isMobile]);

  const { user } = useUser();
  const { signOut } = useClerk();

  const handleMouseEnter = (href: string) => router.prefetch(href);

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
      if (isMobile) setIsMobileOpen(false);
      router.push(href);
      setTimeout(() => setNavigatingTo(null), 100);
    }
  };

  return (
    <>
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 right-4 z-50 lg:hidden"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}

      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          isMobile && !isMobileOpen && "-translate-x-full",
          isMobile && isMobileOpen && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b border-border px-4">
            <button
              onClick={() => handleNavigation("/dashboard")}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Logo size="md" variant="icon" priority />
              <span className="text-base font-medium text-foreground">Revvy</span>
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {navigationSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.heading && (
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {section.heading}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === item.href ||
                          pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    const isNavigating = navigatingTo === item.href;

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        onMouseEnter={() => handleMouseEnter(item.href)}
                        disabled={isNavigating}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                          isNavigating && "opacity-50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                          strokeWidth={1.75}
                        />
                        <span className="flex-1 text-left">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-md px-1 py-1">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "User"} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.firstName, user?.lastName, user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.fullName || user?.firstName || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={() => signOut({ redirectUrl: "/" })}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
