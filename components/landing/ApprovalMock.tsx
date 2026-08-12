"use client";

/**
 * The hero's product moment: the approval trail, set into the photograph's own
 * flat beige margin on the right.
 *
 * That margin is only ~205px wide at a 1500px viewport, which rules out both a
 * horizontal three-column layout and any line as long as an email address. So
 * this is condensed and vertical: marker, label, timestamp. The verification
 * step still earns its place because it is the thing only this product does —
 * the portal link is a bearer token, so possession alone must not be enough.
 *
 * Three earlier attempts failed here, and the reasons are worth keeping:
 *  1. A rounded panel with window chrome and buttons — the house style of every
 *     generated landing page, and it fought the photo it sat on.
 *  2. Bare type spread across the whole photo — unreadable over the subject.
 *  3. Dots placed at `left-0` inside a list padded to 4.25rem, i.e. the same x
 *     as the first character, so every line rendered as "•Review link sent".
 *
 * Hence the fixed gutter track below. Markers live in their own column, so they
 * cannot overlap the type whatever the copy does — alignment is structural, not
 * a magic offset that has to match a dot's centre.
 *
 * Motion:
 * - The status pair keeps `.anim-status-before` / `.anim-status-after` so the
 *   prefers-reduced-motion rules in globals.css resolve this to the settled,
 *   approved frame with no extra CSS.
 * - Everything else rests visible and the check's base strokeDashoffset is 0, so
 *   with motion disabled it reads as a completed record.
 */

/* Tuned against the beige, not the canvas: these sit on the photograph's
   out-of-focus margin, so contrast comes from ink opacity rather than the
   --ink-faint token, which was mixed for the page background. */
const STAMP =
  "font-mono text-[8.5px] tabular-nums uppercase tracking-[0.1em] text-[rgb(var(--ink))]/50";
const LABEL = "text-[11.5px] leading-tight text-[rgb(var(--ink))]";
const DOT = "h-[6px] w-[6px] shrink-0 rounded-full bg-[rgb(var(--ink))]/35";
/** Vertical connector between markers. */
const LINK = "mt-1 w-px flex-1 bg-[rgb(var(--ink))]/22";
const ROW = "grid grid-cols-[0.7rem_1fr] gap-x-2.5";

export function ApprovalMock() {
  return (
    <div className="select-none" aria-hidden>
      <ol>
        {/* 1 — the ask goes out */}
        <li className={ROW}>
          <div className="flex flex-col items-center">
            <span className={`mt-[0.3rem] ${DOT}`} />
            <span className={LINK} />
          </div>
          <div className="pb-3">
            <p className={LABEL}>Review link sent</p>
            <p className={`mt-0.5 ${STAMP}`}>09:02</p>
          </div>
        </li>

        {/* 2 — the step that makes the approval mean anything */}
        <li className={ROW}>
          <div className="flex flex-col items-center">
            <span className={`mt-[0.3rem] ${DOT}`} />
            <span className={LINK} />
          </div>
          <div className="pb-3">
            <p className={LABEL}>Code verified</p>
            <p className={`mt-0.5 ${STAMP}`}>09:11</p>
          </div>
        </li>

        {/* 3 — the landing. Check sits in the gutter, never over the type. */}
        <li className={ROW}>
          <div className="flex justify-center">
            <svg
              viewBox="0 0 24 24"
              className="mt-[0.1rem] h-[0.72rem] w-[0.72rem] shrink-0"
              fill="none"
            >
              <path
                d="M5 12.5l4.2 4L19 7.5"
                stroke="rgb(var(--accent))"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="24"
                strokeDashoffset="0"
                className="anim"
                style={{
                  animationName: "revvy-draw-loop",
                  animationTimingFunction: "cubic-bezier(0.65,0,0.35,1)",
                }}
              />
            </svg>
          </div>
          <div>
            {/* Fixed height so the stamp below doesn't shift on the cross-fade */}
            <div className="relative h-[1.4rem]">
              <p
                className={`anim anim-status-before absolute inset-x-0 top-0 ${LABEL}`}
                style={{ animationName: "revvy-status" }}
              >
                Awaiting approval
              </p>
              <p
                className="anim anim-status-after font-display absolute inset-x-0 -top-[0.2rem] text-[1.3rem] leading-none tracking-[-0.02em] text-[rgb(var(--ink))]"
                style={{ animationName: "revvy-status-in" }}
              >
                Approved.
              </p>
            </div>
            <p className={STAMP}>09:14 · Chukwuma</p>
          </div>
        </li>
      </ol>

      <p className="mt-3 border-t border-[rgb(var(--ink))]/12 pt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[rgb(var(--ink))]/50">
        No follow-up sent
      </p>
    </div>
  );
}
