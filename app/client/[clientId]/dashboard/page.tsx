"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  BarChart3,
  Settings,
  FileText,
  History,
  Loader2,
  ExternalLink,
  Twitter,
  Instagram,
  Linkedin,
  Music2,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/lib/toast";

interface DashboardData {
  clientName: string;
  stats: {
    postsThisMonth: number;
    pendingApprovals: number;
    publishedThisMonth: number;
    upcomingCount: number;
    publishRate: number;
  };
  platformBreakdown: { platform: string; count: number }[];
  posts: Array<{
    id: number;
    platform: string;
    content: string;
    scheduledFor: string | null;
    posted: boolean | null;
    postedAt: string | null;
    approvalStatus: string | null;
  }>;
  pendingApprovals: Array<{
    id: number;
    approvalToken: string;
    status: string;
    content: string;
    platform: string;
    scheduledFor: string | null;
  }>;
  preferences?: {
    emailApprovals: boolean;
    emailReminders: boolean;
    notes: string;
  };
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const cls = "w-3.5 h-3.5";
  if (p.includes("twitter") || p === "x") return <Twitter className={cls} />;
  if (p.includes("instagram")) return <Instagram className={cls} />;
  if (p.includes("linkedin")) return <Linkedin className={cls} />;
  if (p.includes("tiktok")) return <Music2 className={cls} />;
  if (p.includes("youtube")) return <Youtube className={cls} />;
  return <FileText className={cls} />;
}

export default function ClientDashboardPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [entered, setEntered] = useState(false);
  const [prefs, setPrefs] = useState({
    emailApprovals: true,
    emailReminders: true,
    notes: "",
  });

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/client/${clientId}/dashboard`, {
        credentials: "include",
      });
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
      if (json.preferences) {
        setPrefs({
          emailApprovals: json.preferences.emailApprovals !== false,
          emailReminders: json.preferences.emailReminders !== false,
          notes: json.preferences.notes || "",
        });
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const savePreferences = async () => {
    if (!clientId) return;
    try {
      setSavingPrefs(true);
      const res = await fetch(`/api/client/${clientId}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        showToast.success("Saved", "Your preferences were updated");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast.error("Couldn’t save", err.error || "Try again");
      }
    } catch {
      showToast.error("Error", "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const stats = data?.stats ?? {
    postsThisMonth: 0,
    pendingApprovals: 0,
    publishedThisMonth: 0,
    upcomingCount: 0,
    publishRate: 0,
  };
  const posts = data?.posts ?? [];
  const pendingApprovals = data?.pendingApprovals ?? [];
  const platforms = data?.platformBreakdown ?? [];

  // Posts splits into what is still coming and what actually went out. The
  // History tab is the record of work delivered, so it reads newest-first by
  // the time it published, falling back to the scheduled time for older rows
  // where postedAt was never recorded.
  const upcomingPosts = posts.filter((p) => !p.posted);
  const publishedPosts = posts
    .filter((p) => p.posted)
    .sort((a, b) => {
      const at = new Date(a.postedAt ?? a.scheduledFor ?? 0).getTime();
      const bt = new Date(b.postedAt ?? b.scheduledFor ?? 0).getTime();
      return bt - at;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-7 h-7 animate-spin text-teal-300/80" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-8 transition-all duration-700 ease-out",
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300/75 mb-2">
            Workspace
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
            {data?.clientName ? `Welcome, ${data.clientName}` : "Your content"}
          </h2>
          <p className="text-sm mt-2 text-slate-300/85 max-w-lg leading-relaxed">
            Review upcoming posts, approve work, and set how you want to be notified.
          </p>
        </div>
        {stats.pendingApprovals > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-1.5 text-xs font-medium text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
            {stats.pendingApprovals} waiting for your review
          </div>
        ) : null}
      </div>

      {/* Stats — strip, not heavy cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
        {[
          { label: "This month", value: stats.postsThisMonth },
          { label: "Needs approval", value: stats.pendingApprovals, highlight: stats.pendingApprovals > 0 },
          { label: "Upcoming", value: stats.upcomingCount },
          { label: "Published", value: stats.publishedThisMonth },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0f172a]/90 px-4 py-4 sm:px-5 sm:py-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {s.label}
            </p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-semibold tabular-nums",
                s.highlight ? "text-amber-200" : "text-white"
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <Tabs
        defaultValue={stats.pendingApprovals > 0 ? "approvals" : "posts"}
        className="space-y-5"
      >
        <TabsList className="p-1 h-auto gap-1 rounded-2xl bg-white/[0.04] border border-white/10 w-full sm:w-auto justify-start overflow-x-auto">
          {[
            { value: "posts", label: "Upcoming", icon: Calendar },
            {
              value: "approvals",
              label: "Approvals",
              icon: CheckCircle2,
              badge: stats.pendingApprovals,
            },
            { value: "history", label: "History", icon: History },
            { value: "analytics", label: "Activity", icon: BarChart3 },
            { value: "preferences", label: "Preferences", icon: Settings },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl px-3.5 py-2 text-sm text-slate-300 data-[state=active]:bg-teal-400 data-[state=active]:text-[#0b1220] data-[state=active]:shadow-none"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/15">
                  {tab.badge}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <Surface>
            {upcomingPosts.length === 0 ? (
              <Empty
                icon={FileText}
                title="Nothing upcoming"
                body="When your agency schedules content, it shows up here. Anything already published is under History."
              />
            ) : (
              <ul className="divide-y divide-white/8">
                {upcomingPosts.map((post) => (
                  <li
                    key={post.id}
                    className="px-5 py-4 sm:px-6 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg capitalize bg-white/8 text-slate-200">
                        <PlatformIcon platform={post.platform} />
                        {post.platform}
                      </span>
                      {post.posted ? (
                        <span className="text-xs text-teal-300">Published</span>
                      ) : (
                        <span className="text-xs text-amber-200/90">
                          {post.scheduledFor
                            ? new Date(post.scheduledFor).toLocaleString()
                            : "Scheduled"}
                        </span>
                      )}
                      {post.approvalStatus && post.approvalStatus !== "approved" ? (
                        <span className="text-xs text-slate-400 capitalize">
                          · {post.approvalStatus.replace("_", " ")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-200/90 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Surface>
            {publishedPosts.length === 0 ? (
              <Empty
                icon={History}
                title="Nothing published yet"
                body="Once a post goes live it is recorded here, so you always have a record of what went out."
              />
            ) : (
              <ul className="divide-y divide-white/8">
                {publishedPosts.map((post) => (
                  <li
                    key={post.id}
                    className="px-5 py-4 sm:px-6 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg capitalize bg-white/8 text-slate-200">
                        <PlatformIcon platform={post.platform} />
                        {post.platform}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-teal-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Published
                      </span>
                      {post.postedAt ? (
                        <span className="text-xs text-slate-400">
                          ·{" "}
                          {new Date(post.postedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-200/90 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="approvals" className="mt-0">
          <Surface>
            {pendingApprovals.length === 0 ? (
              <Empty
                icon={CheckCircle2}
                title="Nothing waiting"
                body="You’re all caught up. New approval requests appear here."
              />
            ) : (
              <ul className="divide-y divide-white/8">
                {pendingApprovals.map((a) => (
                  <li
                    key={a.id}
                    className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-lg capitalize bg-amber-400/15 text-amber-100">
                        <PlatformIcon platform={a.platform} />
                        {a.platform}
                      </span>
                      <p className="text-sm mt-2 text-slate-100 line-clamp-2 leading-relaxed">
                        {a.content}
                      </p>
                      {a.scheduledFor ? (
                        <p className="text-xs mt-1.5 text-slate-400">
                          Scheduled {new Date(a.scheduledFor).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <Link href={`/client-portal/${a.approvalToken}`} className="shrink-0">
                      <Button
                        size="sm"
                        className="rounded-xl h-10 px-4 bg-teal-400 text-[#0b1220] font-semibold hover:bg-teal-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Review
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-4">
          <Surface className="p-5 sm:p-6 space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
                  Publish rate this month
                </p>
                <p className="text-4xl font-semibold mt-1 tabular-nums text-white tracking-tight">
                  {stats.publishRate}%
                </p>
              </div>
              <p className="text-sm text-right text-slate-400">
                {stats.publishedThisMonth} published
                <br />
                {stats.postsThisMonth} scheduled
              </p>
            </div>

            {platforms.length === 0 ? (
              <p className="text-sm py-8 text-center text-slate-400">
                Platform mix appears once posts are scheduled.
              </p>
            ) : (
              <div className="space-y-3.5">
                {platforms.map((p) => {
                  const max = Math.max(...platforms.map((x) => x.count), 1);
                  return (
                    <div key={p.platform} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize text-slate-200 inline-flex items-center gap-2">
                          <PlatformIcon platform={p.platform} />
                          {p.platform}
                        </span>
                        <span className="text-slate-400 tabular-nums">{p.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-700"
                          style={{ width: `${(p.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 pt-1">
              Engagement from connected platforms shows up after posts go live.
            </p>
          </Surface>
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <Surface className="p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight">Preferences</h3>
              <p className="text-sm text-slate-400 mt-1">
                Tell your agency how you want to stay in the loop.
              </p>
            </div>

            <PrefToggle
              checked={prefs.emailApprovals}
              onChange={(v) => setPrefs((p) => ({ ...p, emailApprovals: v }))}
              title="Email me when a post needs approval"
              body="You’ll get a link to review and approve."
            />
            <PrefToggle
              checked={prefs.emailReminders}
              onChange={(v) => setPrefs((p) => ({ ...p, emailReminders: v }))}
              title="Reminder before a scheduled post goes live"
              body="A heads-up so nothing publishes by surprise."
            />

            <div>
              <label className="text-sm font-medium block mb-2 text-slate-200">
                Notes for your agency
              </label>
              <textarea
                value={prefs.notes}
                onChange={(e) => setPrefs((p) => ({ ...p, notes: e.target.value }))}
                rows={4}
                placeholder="Tone, topics to avoid, launch dates…"
                className="w-full px-3.5 py-3 border border-white/10 rounded-2xl text-sm bg-black/25 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-400/35 resize-none"
              />
            </div>

            <Button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="rounded-2xl h-11 px-6 bg-teal-400 text-[#0b1220] font-semibold hover:bg-teal-300"
            >
              {savingPrefs ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save preferences
            </Button>
          </Surface>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function PrefToggle({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3.5 text-left rounded-2xl border border-white/8 bg-black/15 px-4 py-3.5 hover:bg-black/25 transition-colors"
    >
      <span
        className={cn(
          "mt-0.5 h-5 w-9 rounded-full relative shrink-0 transition-colors",
          checked ? "bg-teal-400" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "left-4" : "left-0.5"
          )}
        />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-100">{title}</span>
        <span className="block text-xs mt-0.5 text-slate-400">{body}</span>
      </span>
    </button>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="py-16 text-center px-6">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1 text-white">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mx-auto">{body}</p>
    </div>
  );
}
