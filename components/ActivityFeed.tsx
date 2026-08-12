"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Calendar,
  Inbox,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityType =
  | "client_approved"
  | "client_requested_changes"
  | "client_created"
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
  /** Skip outer card chrome when nested in another card */
  embedded?: boolean;
}

export function ActivityFeed({
  maxItems = 20,
  autoRefresh = true,
  embedded = false,
}: ActivityFeedProps) {
  const { userId } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = userId ? `/api/activity?userId=${encodeURIComponent(userId)}` : "/api/activity";
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data.slice(0, maxItems) : []);
      } else {
        setActivities([]);
        setError("Couldn't load activity");
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      setActivities([]);
      setError("Couldn't load activity");
    } finally {
      setLoading(false);
    }
  }, [userId, maxItems]);

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchActivities]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "client_approved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "client_requested_changes":
        return <MessageSquare className="w-4 h-4 text-yellow-600" />;
      case "client_created":
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case "payment_overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "credits_warning":
      case "credits_exceeded":
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case "task_assigned":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "post_published":
        return <Calendar className="w-4 h-4 text-foreground" />;
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
          !embedded && "rounded-lg border p-4",
          !embedded && ("bg-card border-border"),
          embedded && "py-2"
        )}
      >
        {!embedded && (
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Recent Activity
          </h3>
        )}
        <p className="text-sm text-gray-500">Loading activity...</p>
      </div>
    );
  }

  const list =
    activities.length === 0 ? (
      <div className={cn(embedded ? "py-4" : "p-6", "text-center")}>
        {error ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        ) : (
          <>
            <Inbox
              className={cn(
                "w-10 h-10 mx-auto mb-3",
                "text-muted-foreground/70"
              )}
            />
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              No recent activity
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add a client, create tasks, get approvals, or schedule posts to see
              updates here.
            </p>
          </>
        )}
      </div>
    ) : (
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={cn(
              "p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors",
              activity.link && "cursor-pointer",
              embedded && "px-0 first:pt-0 last:pb-0"
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
    );

  if (embedded) {
    return <div>{!isCollapsed && list}</div>;
  }

  return (
    <div
      className={cn(
        "rounded-lg border",
        "bg-card border-border"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        {activities.length > 0 && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        )}
      </div>

      {!isCollapsed && list}
    </div>
  );
}
