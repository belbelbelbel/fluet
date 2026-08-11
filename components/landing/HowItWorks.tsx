"use client";

import { RuledSection, SectionLabel } from "./Frame";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Add the client once",
    body: "Invite them by email. They get their own dashboard with everything scheduled for them — no logins to remember, no folder to share.",
  },
  {
    n: "02",
    title: "Send the work for approval",
    body: "Every post becomes a link. Your client approves, requests changes, or leaves a note. You see exactly where each piece stands.",
  },
  {
    n: "03",
    title: "Approved work publishes itself",
    body: "Nothing goes out until it's signed off. Once it is, Revvy posts on schedule and pulls the numbers back into your report.",
  },
];

export function HowItWorks() {
  return (
    <RuledSection id="how" className="py-20 sm:py-24">
      <Reveal>
        <SectionLabel>How it works</SectionLabel>
      </Reveal>

      <Reveal delay={60}>
        <h2 className="font-display mt-7 max-w-2xl text-[clamp(2.1rem,4.6vw,3.25rem)] text-[rgb(var(--ink))]">
          Three steps between a draft and a{" "}
          <span className="italic">published post</span>.
        </h2>
      </Reveal>

      <div className="mt-14 border-t border-[rgb(var(--rule))] sm:mt-16">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 90}>
            <div className="grid grid-cols-1 gap-4 border-b border-[rgb(var(--rule))] py-9 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10 sm:py-11">
              <span className="font-mono text-[12px] tracking-widest text-[rgb(var(--ink-faint))] sm:pt-1.5">
                {step.n}
              </span>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] md:gap-12">
                <h3 className="text-[19px] font-medium leading-snug text-[rgb(var(--ink))] sm:text-[21px]">
                  {step.title}
                </h3>
                <p className="max-w-xl text-[15px] leading-relaxed text-[rgb(var(--ink-soft))]">
                  {step.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </RuledSection>
  );
}
