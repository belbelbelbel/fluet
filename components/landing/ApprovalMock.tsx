"use client";

/**
 * The hero's product moment — deliberately NOT a card.
 *
 * Previous versions were a rounded panel with window chrome and two buttons,
 * which is the house style of every generated landing page and said nothing
 * about this product. A bordered box also competes with the photograph it sits
 * on instead of belonging to it.
 *
 * This is an audit trail instead: a hairline rail, mono timestamps, and the
 * approval landing at the end on its own. It argues the headline directly —
 * the sequence finishes without anyone chasing it — and it shows the thing only
 * Revvy does, which is prove *who* approved. The portal link is a bearer token,
 * so possession alone must not be enough; the verified step is the product.
 *
 * Legibility over the photo comes from placement (the flat, out-of-focus warm
 * area) plus one soft radial scrim. The scrim is blurred with no edge or radius
 * on purpose — it lifts the text without reintroducing a panel.
 *
 * Motion notes:
 * - The two status labels keep the `.anim-status-before` / `.anim-status-after`
 *   class names so the existing prefers-reduced-motion rules in globals.css
 *   resolve this to the settled, approved frame with no extra CSS.
 * - Everything else rests VISIBLE in base CSS, so when reduced-motion sets
 *   `animation: none`, the trail simply reads as a finished record.
 */
export function ApprovalMock() {
  return (
    <div className="relative select-none" aria-hidden>
      {/* Soft ground for legibility — blurred, edgeless, not a panel */}
      <div
        className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 45% 45%, rgba(247,246,243,0.94), rgba(247,246,243,0.62) 55%, rgba(247,246,243,0) 78%)",
          filter: "blur(6px)",
        }}
      />

      <ol className="relative pl-[4.25rem]">
        {/* The rail. Stops short of the last node so the approval sits free. */}
        <span className="absolute left-[4.25rem] top-2 h-[4.6rem] w-px -translate-x-1/2 bg-[rgb(var(--ink))]/14" />

        {/* 1 — the ask goes out */}
        <li className="relative pb-5">
          <span className="absolute -left-[4.25rem] top-[0.1rem] font-mono text-[9.5px] tabular-nums text-[rgb(var(--ink-faint))]">
            09:02
          </span>
          <span className="absolute left-0 top-[0.3rem] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[rgb(var(--ink))]/25" />
          <p className="text-[12.5px] leading-none text-[rgb(var(--ink-soft))]">
            Review link sent
          </p>
          <p className="mt-1 font-mono text-[9.5px] text-[rgb(var(--ink-faint))]">
            chukwuma@sisiyemmie.co
          </p>
        </li>

        {/* 2 — the part that makes the approval mean something */}
        <li className="relative pb-5">
          <span className="absolute -left-[4.25rem] top-[0.1rem] font-mono text-[9.5px] tabular-nums text-[rgb(var(--ink-faint))]">
            09:11
          </span>
          <span className="absolute left-0 top-[0.3rem] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[rgb(var(--ink))]/25" />
          <p className="text-[12.5px] leading-none text-[rgb(var(--ink-soft))]">
            Identity verified
          </p>
          <p className="mt-1 font-mono text-[9.5px] text-[rgb(var(--ink-faint))]">
            emailed code · link alone can&apos;t approve
          </p>
        </li>

        {/* 3 — the landing. No dot on the rail; the drawn check is the marker. */}
        <li className="relative">
          <span className="absolute -left-[4.25rem] top-[0.35rem] font-mono text-[9.5px] tabular-nums text-[rgb(var(--accent))]">
            09:14
          </span>

          {/* Check draws itself, then holds for the rest of the loop */}
          <svg
            viewBox="0 0 24 24"
            className="absolute left-0 top-[0.15rem] h-[1.15rem] w-[1.15rem] -translate-x-1/2 overflow-visible"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="11"
              className="fill-[rgb(var(--accent-soft))]"
            />
            <path
              d="M6.5 12.4l3.6 3.5L17.6 8.6"
              stroke="rgb(var(--accent))"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              // Base state is drawn, so reduced-motion shows a finished check.
              strokeDasharray="22"
              strokeDashoffset="0"
              className="anim"
              style={{
                animationName: "revvy-draw-loop",
                animationTimingFunction: "cubic-bezier(0.65,0,0.35,1)",
              }}
            />
          </svg>

          {/* One label swaps for the other, mid-loop */}
          <div className="relative h-[1.75rem]">
            <p
              className="anim anim-status-before absolute inset-0 text-[12.5px] leading-none text-[rgb(var(--ink-soft))]"
              style={{ animationName: "revvy-status" }}
            >
              Awaiting approval
            </p>
            <p
              className="anim anim-status-after font-display absolute inset-0 text-[1.6rem] leading-none tracking-[-0.02em] text-[rgb(var(--ink))]"
              style={{ animationName: "revvy-status-in" }}
            >
              Approved.
            </p>
          </div>

          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[rgb(var(--ink-faint))]">
            Chukwuma · Instagram · Tue
          </p>
        </li>
      </ol>

      {/* The headline's promise, stated as a fact about the record */}
      <p className="mt-5 pl-[4.25rem] font-mono text-[9px] uppercase tracking-[0.14em] text-[rgb(var(--ink-faint))]">
        No follow-up sent
      </p>
    </div>
  );
}
