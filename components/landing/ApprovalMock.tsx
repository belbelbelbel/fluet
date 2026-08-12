"use client";

/**
 * The hero's product moment: the approval trail, run horizontally under the
 * photograph.
 *
 * History worth keeping, since this went wrong twice:
 *  1. A rounded panel with window chrome and two buttons — the house style of
 *     every generated landing page, and it said nothing about this product.
 *  2. A vertical trail overlaid on the photo — bare type has no opaque ground,
 *     so it was unreadable over the subject, and dots positioned at `left-0`
 *     inside a padded list collided with the first character of every line.
 *
 * So: on the canvas, never over the image, and laid out left-to-right so it
 * fills the width beneath the photo instead of leaving a column of dead space.
 *
 * Each step renders its own connector as a flex sibling of its dot rather than
 * an absolutely-positioned rule. That's deliberate — an absolute line needs an
 * offset that matches the dot's centre, and that offset is exactly the kind of
 * magic number that broke the previous version. Here alignment is structural.
 *
 * Motion:
 * - The status pair keeps the `.anim-status-before` / `.anim-status-after` hooks
 *   so the prefers-reduced-motion rules in globals.css resolve this to the
 *   settled, approved frame with no extra CSS.
 * - Everything else rests visible, and the check's base strokeDashoffset is 0,
 *   so with motion disabled it reads as a completed record.
 */

const DOT = "h-[7px] w-[7px] shrink-0 rounded-full";
// Connectors only once the steps sit side by side; stacked they point nowhere.
const RULE =
  "ml-2 hidden h-[1.5px] flex-1 rounded-full bg-[rgb(var(--ink))]/25 sm:block";
const STAMP =
  "font-mono text-[9px] tabular-nums uppercase tracking-[0.1em] text-[rgb(var(--ink-faint))]";

export function ApprovalMock() {
  return (
    <div className="select-none" aria-hidden>
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[rgb(var(--ink-faint))]">
        One link · one trail
      </p>

      <ol className="mt-5 grid grid-cols-1 gap-y-5 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-0">
        {/* 1 — the ask goes out */}
        <li className="min-w-0">
          <p className={STAMP}>09:02</p>
          <div className="mt-2 flex items-center">
            <span className={`${DOT} bg-[rgb(var(--ink))]/30`} />
            <span className={RULE} />
          </div>
          <p className="mt-3 text-[13px] leading-tight text-[rgb(var(--ink))]">
            Review link sent
          </p>
          <p className="mt-1 truncate font-mono text-[9px] text-[rgb(var(--ink-faint))]">
            chukwuma@sisiyemmie.co
          </p>
        </li>

        {/* 2 — the step that makes the approval mean anything */}
        <li className="min-w-0">
          <p className={STAMP}>09:11</p>
          <div className="mt-2 flex items-center">
            <span className={`${DOT} bg-[rgb(var(--ink))]/30`} />
            <span className={RULE} />
          </div>
          <p className="mt-3 text-[13px] leading-tight text-[rgb(var(--ink))]">
            Identity verified
          </p>
          <p className="mt-1 font-mono text-[9px] leading-snug text-[rgb(var(--ink-faint))]">
            emailed code — the link alone can&apos;t approve
          </p>
        </li>

        {/* 3 — the landing. No trailing rule; the trail ends here. */}
        <li className="min-w-0">
          <p className={`${STAMP} text-[rgb(var(--accent))]`}>09:14</p>
          <div className="mt-2 flex items-center">
            {/* Ring instead of a filled dot so the terminal node reads as
                different in kind, then the check draws inside it. */}
            <span className="relative flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent-soft))] ring-1 ring-[rgb(var(--accent))]/25">
              <svg viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill="none">
                <path
                  d="M6 12.4l3.9 3.8L18 8"
                  stroke="rgb(var(--accent))"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="22"
                  strokeDashoffset="0"
                  className="anim"
                  style={{
                    animationName: "revvy-draw-loop",
                    animationTimingFunction: "cubic-bezier(0.65,0,0.35,1)",
                  }}
                />
              </svg>
            </span>
          </div>

          {/* Fixed height so the line below never shifts as the labels cross-fade */}
          <div className="relative mt-3 h-[1.6rem]">
            <p
              className="anim anim-status-before absolute inset-x-0 top-0 text-[13px] leading-tight text-[rgb(var(--ink-soft))]"
              style={{ animationName: "revvy-status" }}
            >
              Awaiting approval
            </p>
            <p
              className="anim anim-status-after font-display absolute inset-x-0 -top-[0.28rem] text-[1.4rem] leading-none tracking-[-0.02em] sm:text-[1.6rem] text-[rgb(var(--ink))]"
              style={{ animationName: "revvy-status-in" }}
            >
              Approved.
            </p>
          </div>
          <p className="font-mono text-[9px] text-[rgb(var(--ink-faint))]">
            by Chukwuma · Instagram
          </p>
        </li>
      </ol>

      <p className="mt-6 border-t border-[rgb(var(--rule))] pt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[rgb(var(--ink-faint))]">
        No follow-up sent
      </p>
    </div>
  );
}
