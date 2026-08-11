"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Youtube,
  Facebook,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Per-platform identity. Colour carries the platform so the text label can
 * stay quiet — previously every platform was an identically-shaped grey (or
 * arbitrarily amber) chip, which read as noise rather than information.
 */
const PLATFORMS: Record<
  string,
  { label: string; icon: typeof Instagram; tint: string; fg: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, tint: "bg-fuchsia-500/12", fg: "text-fuchsia-500" },
  linkedin: { label: "LinkedIn", icon: Linkedin, tint: "bg-sky-500/12", fg: "text-sky-500" },
  twitter: { label: "X", icon: Twitter, tint: "bg-slate-500/12", fg: "text-slate-500" },
  x: { label: "X", icon: Twitter, tint: "bg-slate-500/12", fg: "text-slate-500" },
  tiktok: { label: "TikTok", icon: Music2, tint: "bg-cyan-500/12", fg: "text-cyan-500" },
  youtube: { label: "YouTube", icon: Youtube, tint: "bg-red-500/12", fg: "text-red-500" },
  facebook: { label: "Facebook", icon: Facebook, tint: "bg-blue-500/12", fg: "text-blue-500" },
};

function platformMeta(platform: string) {
  const key = (platform || "").toLowerCase();
  return (
    PLATFORMS[key] ??
    Object.entries(PLATFORMS).find(([k]) => key.includes(k))?.[1] ?? {
      label: platform || "Post",
      icon: Calendar,
      tint: "bg-violet-500/12",
      fg: "text-violet-500",
    }
  );
}

export type PostStatus = "pending" | "approved" | "changes_requested" | "rejected" | "scheduled";

const STATUS: Record<PostStatus, { label: string; rail: string; dot: string; fg: string }> = {
  pending: { label: "Awaiting approval", rail: "bg-amber-400", dot: "bg-amber-400", fg: "text-amber-600 dark:text-amber-400" },
  approved: { label: "Approved", rail: "bg-emerald-500", dot: "bg-emerald-500", fg: "text-emerald-600 dark:text-emerald-400" },
  changes_requested: { label: "Changes requested", rail: "bg-orange-500", dot: "bg-orange-500", fg: "text-orange-600 dark:text-orange-400" },
  rejected: { label: "Rejected", rail: "bg-rose-500", dot: "bg-rose-500", fg: "text-rose-600 dark:text-rose-400" },
  scheduled: { label: "Scheduled", rail: "bg-slate-300 dark:bg-slate-600", dot: "bg-slate-400", fg: "text-slate-500" },
};

/**
 * "in 3 days" beats "8 Aug, 00:16" for a queue you scan — the exact stamp
 * stays available as a tooltip.
 */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Not scheduled";

  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  const rel =
    mins < 1 ? "now" : mins < 60 ? `${mins}m` : hours < 24 ? `${hours}h` : days < 30 ? `${days}d` : `${Math.round(days / 30)}mo`;

  if (rel === "now") return "now";
  return diff > 0 ? `in ${rel}` : `${rel} ago`;
}

export function absoluteTime(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Not scheduled";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hashtags are metadata, not copy. Pulling the trailing run out lets the
 * actual message read as a sentence instead of a wall.
 */
function splitHashtags(content: string): { body: string; tags: string[] } {
  const text = (content || "").trim();
  const match = text.match(/(?:\bhashtags?\s*:\s*)?((?:#[\w][\w-]*\s*)+)$/i);
  if (!match) return { body: text, tags: [] };

  const tags = (match[1].match(/#[\w][\w-]*/g) || []).slice(0, 8);
  if (tags.length === 0) return { body: text, tags: [] };

  const body = text.slice(0, match.index).replace(/\s*hashtags?\s*:?\s*$/i, "").trim();
  return { body: body || text, tags: body ? tags : [] };
}

export function PostRow({
  platform,
  content,
  scheduledFor,
  status,
  actions,
  onClick,
}: {
  platform: string;
  content: string;
  scheduledFor: string | null;
  status?: PostStatus | null;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const meta = platformMeta(platform);
  const Icon = meta.icon;
  const state = STATUS[status ?? "scheduled"] ?? STATUS.scheduled;
  const { body, tags } = splitHashtags(content);

  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick?.())
          : undefined
      }
      className={cn(
        "group relative flex gap-4 rounded-xl px-4 py-4 transition-colors sm:px-5",
        interactive && "cursor-pointer",
        interactive && (isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50")
      )}
    >
      {/* Status rail — state readable before a single word is parsed */}
      <span
        aria-hidden
        className={cn("absolute left-0 top-4 bottom-4 w-[3px] rounded-full", state.rail)}
      />

      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          meta.tint,
          meta.fg
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={cn("font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>
            {meta.label}
          </span>
          <span className={isDark ? "text-slate-600" : "text-slate-300"}>·</span>
          <span
            title={absoluteTime(scheduledFor)}
            className={cn("tabular-nums", isDark ? "text-slate-400" : "text-slate-500")}
          >
            {relativeTime(scheduledFor)}
          </span>
          {status && status !== "scheduled" && (
            <>
              <span className={isDark ? "text-slate-600" : "text-slate-300"}>·</span>
              <span className={cn("inline-flex items-center gap-1.5 font-medium", state.fg)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", state.dot)} />
                {state.label}
              </span>
            </>
          )}
        </div>

        <p
          className={cn(
            "line-clamp-2 text-[13.5px] leading-relaxed",
            isDark ? "text-slate-300" : "text-slate-700"
          )}
        >
          {body}
        </p>

        {tags.length > 0 && (
          <p
            className={cn(
              "mt-1.5 truncate text-xs",
              isDark ? "text-slate-500" : "text-slate-400"
            )}
          >
            {tags.join(" ")}
          </p>
        )}
      </div>

      {actions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-2 self-center opacity-100 transition-opacity sm:opacity-60 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
