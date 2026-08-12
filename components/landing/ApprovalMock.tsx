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
 * Deliberately NOT a fake browser window. Three traffic-light dots are the
 * default shorthand for "this is software" and say nothing about this product.
 * What's actually unique here is that the approver's identity is proven: the
 * portal link is a bearer token, so possession alone can't approve, and a code
 * sent to the client's address on file closes that gap. The verified address in
 * the header is the whole differentiator, so it leads.
 *
 * Layout is asymmetric on purpose — thumbnail beside the copy, Approve wider
 * than Request changes — because evenly-split halves read as a wireframe.
 *
 * Choreography is one shared timeline in globals.css (`.anim`); the `.anim-*`
 * hooks let prefers-reduced-motion resolve it to a single coherent frame.
 */
export function ApprovalMock() {
  return (
    <div className="relative select-none" aria-hidden>
      <div className="mock-loop relative rounded-2xl border border-[rgb(var(--rule))] bg-[rgb(var(--surface))] shadow-[0_2px_4px_rgba(18,18,17,0.04),0_24px_48px_-20px_rgba(18,18,17,0.28)]">
        {/* Who is approving, and the proof it's really them */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="flex items-start gap-2.5">
            {/* Ring rather than a flat fill — reads as an avatar slot, not a dot */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent-soft))] font-mono text-[10px] font-semibold text-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent))]/15">
              CD
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-medium text-[rgb(var(--ink))]">
                Chukwuma Davis
              </p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[9.5px] text-[rgb(var(--ink-faint))]">
                chukwuma@sisiyemmie.co
                <span className="inline-flex items-center gap-0.5 text-[rgb(var(--accent))]">
                  <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />
                  VERIFIED
                </span>
              </p>
            </div>
          </div>
          <InstagramIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--ink-faint))]" />
        </div>

        {/* The work itself — thumbnail beside the copy, inset on canvas so the
            card above it reads as the raised surface */}
        <div className="mx-4 mt-3.5 flex gap-3 rounded-xl bg-[rgb(var(--canvas))] p-3 ring-1 ring-inset ring-[rgb(var(--rule))]">
          <div
            className="h-14 w-14 shrink-0 rounded-lg ring-1 ring-[rgb(var(--ink))]/10"
            style={{
              // Stands in for the photograph being approved. Warm tones tie it
              // to the hero rather than sitting there as a grey placeholder.
              backgroundImage:
                "radial-gradient(120% 90% at 25% 18%, rgba(255,255,255,0.55), transparent 55%), linear-gradient(150deg, #e8a765 0%, #d4813f 48%, #a8552a 100%)",
            }}
          />
          <div className="min-w-0">
            <p className="text-[12.5px] leading-snug text-[rgb(var(--ink))]">
              Fresh batch just landed. Jollof, small chops and the good stuff —
              open till 10 tonight.
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-[rgb(var(--ink-faint))]">
              Instagram · Tue 09:00
            </p>
          </div>
        </div>

        {/* Decision. One label swaps for the other mid-loop. */}
        <div className="px-4 pb-4">
          <div className="relative mt-3 h-4">
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
                Approved
              </span>
              {/* The audit trail, in mono — this is what gets recorded */}
              <span className="font-mono text-[9px] text-[rgb(var(--ink-faint))]">
                09:14 · CHUKWUMA
              </span>
            </div>
          </div>

          {/* Weighted, not split down the middle */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="anim relative flex basis-[60%] items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--ink))] py-2 text-[12px] font-medium text-white shadow-[0_1px_2px_rgba(18,18,17,0.18)]"
              style={{ animationName: "revvy-press" }}
            >
              <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
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
