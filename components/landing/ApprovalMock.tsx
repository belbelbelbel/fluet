"use client";

import { CheckIcon, InstagramIcon, MousePointer2Icon } from "lucide-react";

/**
 * The hero's product card: a client approving a post, on a 7s loop.
 *
 * Sits overlaid on the hero photograph, so it stays deliberately compact — one
 * card, no soft-blur ground, no second floating panel. Built in DOM rather than
 * as a screenshot so it stays sharp at any resolution and survives the dashboard
 * redesign that's still in flight.
 *
 * Choreography is one shared timeline in globals.css (`.anim`); the `.anim-*`
 * hooks let prefers-reduced-motion resolve it to a single coherent frame.
 */
export function ApprovalMock() {
  return (
    <div className="relative select-none" aria-hidden>
      <div className="mock-loop relative rounded-2xl border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] shadow-[0_2px_4px_rgba(18,18,17,0.04),0_24px_48px_-20px_rgba(18,18,17,0.28)]">
        {/* Window chrome — reads as a real product surface */}
        <div className="flex items-center gap-1.5 border-b border-[rgb(var(--rule))] px-3.5 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--rule))]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--rule))]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--rule))]" />
          <span className="ml-1.5 font-mono text-[10px] text-[rgb(var(--ink-faint))]">
            revvy.pro/approve
          </span>
        </div>

        <div className="p-4">
          {/* Who it's for */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--accent))] font-mono text-[10px] font-medium text-white">
                CD
              </div>
              <div className="leading-tight">
                <p className="text-[12.5px] font-medium text-[rgb(var(--ink))]">
                  Chukwuma Davis
                </p>
                <p className="font-mono text-[9px] text-[rgb(var(--ink-faint))]">
                  CLIENT · REVIEW REQUEST
                </p>
              </div>
            </div>
            <InstagramIcon className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--ink-faint))]" />
          </div>

          {/* The post being reviewed */}
          <div className="mt-3.5 rounded-xl border border-[rgb(var(--rule))] bg-[rgb(var(--canvas))] p-3">
            <p className="text-[12.5px] leading-relaxed text-[rgb(var(--ink))]">
              Fresh batch just landed. Jollof, small chops and the good stuff —
              open till 10 tonight.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="rounded-md bg-[rgb(var(--surface))] px-1.5 py-0.5 font-mono text-[9px] text-[rgb(var(--ink-soft))] ring-1 ring-[rgb(var(--rule))]">
                1 IMAGE
              </span>
              <span className="rounded-md bg-[rgb(var(--surface))] px-1.5 py-0.5 font-mono text-[9px] text-[rgb(var(--ink-soft))] ring-1 ring-[rgb(var(--rule))]">
                TUE · 09:00
              </span>
            </div>
          </div>

          {/* Status line — one label swaps for the other mid-loop */}
          <div className="relative mt-3.5 h-4">
            <div
              className="anim anim-status-before absolute inset-0 flex items-center gap-1.5"
              style={{ animationName: "revvy-status" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11.5px] text-[rgb(var(--ink-soft))]">
                Awaiting approval
              </span>
            </div>
            <div
              className="anim anim-status-after absolute inset-0 flex items-center gap-1.5"
              style={{ animationName: "revvy-status-in" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
              <span className="text-[11.5px] font-medium text-[rgb(var(--accent))]">
                Approved by Chukwuma
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1.5">
            <div
              className="anim relative flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--ink))] py-2 text-[12px] font-medium text-white"
              style={{ animationName: "revvy-press" }}
            >
              <CheckIcon className="h-3 w-3" />
              Approve
            </div>
            <div className="flex-1 rounded-lg py-2 text-center text-[12px] text-[rgb(var(--ink-soft))] ring-1 ring-[rgb(var(--rule))]">
              Request changes
            </div>
          </div>
        </div>

        {/* Cursor travels in, clicks Approve, leaves */}
        <div
          className="anim anim-cursor absolute bottom-[3.1rem] left-[26%] z-20"
          style={{ animationName: "revvy-cursor" }}
        >
          <MousePointer2Icon className="h-4 w-4 fill-[rgb(var(--ink))] text-white drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
