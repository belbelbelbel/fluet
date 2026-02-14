"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export type ActivityType =
  | "client_approved"
  | "client_requested_changes"
  | "payment_overdue"
  | "credits_warning"
  | "credits_exceeded"
  | "task_assigned"
  | "post_published";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  clientName?: string;
  timestamp: string;
  link?: string;
}

interface ActivityFeedProps {
  maxItems?: number;
  autoRefresh?: boolean;
}

export function ActivityFeed({
  maxItems = 20,
  autoRefresh = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 60000); // Refresh every 60 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.slice(0, maxItems));
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "client_approved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "client_requested_changes":
        return <MessageSquare className="w-4 h-4 text-yellow-600" />;
      case "payment_overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "credits_warning":
      case "credits_exceeded":
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case "task_assigned":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "post_published":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (loading && activities.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border p-4",
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        )}
      >
        <p className="text-sm text-gray-500">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border",
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors",
                activity.link && "cursor-pointer"
              )}
              onClick={() => {
                if (activity.link) {
                  window.location.href = activity.link;
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
