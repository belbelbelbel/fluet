"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttentionSeverity = "critical" | "warning" | "info";

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  /** Group heading, e.g. "Awaiting approval" */
  group: string;
  /** Primary text — usually the client name */
  label: string;
  /** Right-aligned secondary text, e.g. "3 posts" or "82% used" */
  meta?: string;
  href?: string;
}

const RANK: Record<AttentionSeverity, number> = {
  critical: 2,
  warning: 1,
  info: 0,
};

/**
 * A single docked toast that replaces stacked alert banners + a full-width
 * "needs attention" panel.
 *
 * Collapsed it is one quiet line, so the dashboard content starts at the top
 * of the page. Expanded it reveals the same grouped, clickable triage list.
 */
export function AttentionToast({
  items,
  blocked = false,
  storageKey = "attention-toast",
}: {
  items: AttentionItem[];
  /** Critical state where actions are blocked until resolved */
  blocked?: boolean;
  storageKey?: string;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden; decided on mount
  const [entered, setEntered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // A dismissal should last the session, not nag on every route change.
  // Keyed by content so a *new* problem re-surfaces even after dismissing.
  const signature = useMemo(
    () =>
      items
        .map((i) => i.id)
        .sort()
        .join("|"),
    [items]
  );

  useEffect(() => {
    if (items.length === 0) return;
    try {
      const seen = sessionStorage.getItem(`${storageKey}:${signature}`);
      setDismissed(seen === "1");
    } catch {
      setDismissed(false);
    }
  }, [signature, items.length, storageKey]);

  useEffect(() => {
    if (dismissed || items.length === 0) return;
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, [dismissed, items.length]);

  // Collapse on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const severity: AttentionSeverity = useMemo(() => {
    return items.reduce<AttentionSeverity>(
      (worst, i) => (RANK[i.severity] > RANK[worst] ? i.severity : worst),
      "info"
    );
  }, [items]);

  // Preserve severity order, then group
  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => RANK[b.severity] - RANK[a.severity]);
    const map = new Map<string, AttentionItem[]>();
    for (const item of sorted) {
      const bucket = map.get(item.group);
      if (bucket) bucket.push(item);
      else map.set(item.group, [item]);
    }
    return Array.from(map.entries());
  }, [items]);

  if (items.length === 0 || dismissed) return null;

  const dot =
    severity === "critical"
      ? "bg-rose-500"
      : severity === "warning"
        ? "bg-amber-400"
        : "bg-teal-400";

  const summary =
    items.length === 1
      ? items[0].meta
        ? `${items[0].label} — ${items[0].group.toLowerCase()}`
        : items[0].label
      : `${items.length} things need your attention`;

  const dismiss = () => {
    setEntered(false);
    try {
      sessionStorage.setItem(`${storageKey}:${signature}`, "1");
    } catch {
      /* non-fatal */
    }
    // let the exit transition play
    setTimeout(() => setDismissed(true), 200);
  };

  return (
    // Offsets clear the dashboard's sticky header, which stacks taller below `sm`.
    <div
      className="pointer-events-none fixed inset-x-0 top-[8rem] sm:top-[5rem] z-40 flex justify-center px-4"
      aria-live="polite"
    >
      <div
        ref={rootRef}
        className={cn(
          "pointer-events-auto w-full max-w-[34rem] overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl",
          "transition-all duration-300 ease-out motion-reduce:transition-none",
          entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          "border-black/[0.07] bg-white/90 shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/40"
        )}
      >
        {/* Collapsed row — always visible */}
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            {severity === "critical" && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden",
                  dot
                )}
              />
            )}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", dot)} />
          </span>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium",
              "text-slate-800 dark:text-slate-100"
            )}
          >
            <span className="truncate">{summary}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none",
                open && "rotate-180",
                "text-muted-foreground"
              )}
            />
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className={cn(
              "shrink-0 rounded-lg p-1 transition-colors",
              "text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Expanded detail */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn(
                "space-y-3 border-t px-3.5 pb-3 pt-3",
                "border-black/[0.06] dark:border-white/[0.07]"
              )}
            >
              {groups.map(([group, groupItems]) => (
                <div key={group}>
                  <p
                    className={cn(
                      "mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      "text-muted-foreground"
                    )}
                  >
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {groupItems.map((item: AttentionItem) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.href) router.push(item.href);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            item.severity === "critical"
                              ? "bg-rose-500"
                              : item.severity === "warning"
                                ? "bg-amber-400"
                                : "bg-teal-400"
                          )}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            "text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {item.label}
                        </span>
                        {item.meta && (
                          <span
                            className={cn(
                              "shrink-0 text-xs tabular-nums",
                              "text-muted-foreground"
                            )}
                          >
                            {item.meta}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {blocked && (
                <p
                  className={cn(
                    "pt-0.5 text-xs",
                    "text-rose-600/90 dark:text-rose-300/80"
                  )}
                >
                  Some actions stay blocked until this is resolved.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
