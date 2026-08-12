/**
 * The hero's closing beat. Replaces four failed attempts at a product mock:
 * a panel with window chrome and buttons, a vertical trail overlaid on the
 * photograph, a horizontal stepped timeline, and a condensed version of that
 * squeezed into the photo's beige margin.
 *
 * They failed for the same reason each time: a row of evenly-spaced dots with
 * connector rules and mono timestamps is the most templated component on the
 * web, so the FORM was the problem, not the styling. And all four were diagrams
 * *about* the product rather than anything real.
 *
 * So no diagram. One sentence carrying the mechanism the subhead doesn't
 * mention — that possession of the link is not enough — plus the audit line
 * underneath. This is the one claim competitors can't make, and it needs no
 * illustration to land.
 *
 * No invented event either ("Chukwuma approved at 09:14"): a fabricated
 * timestamp reads as a fake testimonial. A statement about how the product
 * works is both honest and stronger.
 *
 * Deliberately static — the removed mock carried a 7s animation loop whose only
 * job was to make a diagram look alive.
 */
export function ApprovalProof() {
  return (
    <div className="max-w-[26rem]" aria-hidden={false}>
      <p className="font-display text-[clamp(1.35rem,2.1vw,1.8rem)] leading-[1.28] tracking-[-0.015em] text-[rgb(var(--ink))]">
        A forwarded link can&apos;t approve.
        <br className="hidden sm:block" /> Only your client can.
      </p>
      <p className="mt-5 border-t border-[rgb(var(--rule))] pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[rgb(var(--ink-faint))]">
        Every approval verified by emailed code
      </p>
    </div>
  );
}
