"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Loader2,
  Bell,
  CheckCircle2,
  MessageSquare,
  Building2,
  AlertTriangle,
  UserPlus,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityType } from "@/components/ActivityFeed";

type InboxItem = {
  id: string;
  title: string;
  body?: string;
  timestamp: string;
  link?: string;
  unread?: boolean;
  source: "notification" | "activity";
  type?: string;
};

function formatRelative(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function activityIcon(type?: ActivityType | string) {
  switch (type) {
    case "client_approved":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "client_requested_changes":
      return <MessageSquare className="w-4 h-4 text-amber-600" />;
    case "client_created":
      return <Building2 className="w-4 h-4 text-sky-600" />;
    case "payment_overdue":
    case "credits_exceeded":
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case "credits_warning":
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case "task_assigned":
      return <UserPlus className="w-4 h-4 text-sky-600" />;
    case "post_published":
      return <Calendar className="w-4 h-4 text-foreground" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function InboxPage() {
  const { userId } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [notifRes, activityRes] = await Promise.all([
        fetch("/api/notifications", { credentials: "include" }),
        fetch(`/api/activity?userId=${encodeURIComponent(userId)}`, {
          credentials: "include",
        }),
      ]);

      const merged: InboxItem[] = [];

      if (notifRes.ok) {
        const data = await notifRes.json();
        for (const n of data.notifications || []) {
          merged.push({
            id: `notif-${n.id}`,
            title: n.title || "Notification",
            body: n.message,
            timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
            link: n.link || undefined,
            unread: !n.read,
            source: "notification",
            type: n.type,
          });
        }
      }

      if (activityRes.ok) {
        const activities: ActivityItem[] = await activityRes.json();
        for (const a of activities || []) {
          // Avoid duping if notification already covers same message
          merged.push({
            id: `act-${a.id}`,
            title: a.message,
            timestamp: a.timestamp,
            link: a.link,
            unread: false,
            source: "activity",
            type: a.type,
          });
        }
      }

      merged.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Dedupe near-identical titles within 1 minute
      const seen = new Set<string>();
      const deduped = merged.filter((item) => {
        const key = `${item.title}|${item.timestamp.slice(0, 16)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(deduped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((i) => i.unread) : items),
    [items, filter]
  );

  const unreadCount = items.filter((i) => i.unread).length;

  const markAllRead = async () => {
    const unread = items.filter(
      (i) => i.unread && i.source === "notification"
    );
    if (unread.length === 0) return;
    setMarking(true);
    try {
      await Promise.all(
        unread.map((i) => {
          const id = i.id.replace("notif-", "");
          return fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ notificationId: Number(id) }),
          });
        })
      );
      setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      className={cn(
        "space-y-6 pt-4 sm:pt-6 lg:pt-8 pb-8 max-w-3xl mx-auto px-4 sm:px-6",
        "bg-background"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              "text-foreground"
            )}
          >
            Inbox
          </h1>
          <p className={cn("text-sm mt-1", "text-muted-foreground")}>
            Approvals, tasks, and workspace updates. Social comments connect later.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
          {unreadCount > 0 ? (
            <Button
              size="sm"
              className="rounded-xl"
              onClick={markAllRead}
              disabled={marking}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground/80 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {f === "all" ? "All" : `Unread${unreadCount ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      <Card
        className={cn(
          "border rounded-2xl overflow-hidden",
          "bg-card border-border"
        )}
      >
        <CardContent className="p-0">
          {loading && items.length === 0 ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Inbox
                className={cn(
                  "w-10 h-10 mx-auto mb-3",
                  "text-muted-foreground/70"
                )}
              />
              <p
                className={cn(
                  "font-medium",
                  "text-foreground"
                )}
              >
                {filter === "unread" ? "You’re caught up" : "Inbox is empty"}
              </p>
              <p
                className={cn(
                  "text-sm mt-1",
                  "text-muted-foreground"
                )}
              >
                Approvals, task assignments, and client updates show up here.
              </p>
            </div>
          ) : (
            <ul
              className={cn(
                "divide-y",
                "divide-gray-100 dark:divide-slate-700"
              )}
            >
              {visible.map((item) => {
                const row = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-4 sm:px-5 py-4 transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-slate-700/40",
                      item.unread && ("bg-sky-50/60 dark:bg-slate-700/20")
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{activityIcon(item.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={cn(
                            "text-sm",
                            item.unread ? "font-semibold" : "font-medium",
                            "text-foreground"
                          )}
                        >
                          {item.title}
                        </p>
                        <span
                          className={cn(
                            "text-xs shrink-0",
                            "text-muted-foreground/70"
                          )}
                        >
                          {formatRelative(item.timestamp)}
                        </span>
                      </div>
                      {item.body && item.body !== item.title ? (
                        <p
                          className={cn(
                            "text-sm mt-0.5 line-clamp-2",
                            "text-muted-foreground"
                          )}
                        >
                          {item.body}
                        </p>
                      ) : null}
                    </div>
                    {item.unread ? (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    ) : null}
                  </div>
                );

                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link href={item.link} className="block">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
