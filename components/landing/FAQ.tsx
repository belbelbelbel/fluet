"use client";

import { PlusIcon } from "lucide-react";
import { RuledSection, SectionLabel } from "./Frame";
import { Reveal } from "./Reveal";

const QUESTIONS = [
  {
    q: "Do my clients need to create an account?",
    a: "No. They get a link by email and confirm it's them with a short code. The same way your bank verifies a login. No password to forget, no seat to pay for.",
  },
  {
    q: "Which platforms does Revvy publish to automatically?",
    a: "Instagram, X and YouTube publish on their own once a post is approved. LinkedIn and TikTok send you a reminder at the scheduled time instead, because their APIs don't allow third-party publishing for most accounts. We'd rather tell you now than at 9am on launch day.",
  },
  {
    q: "Can I pay in naira?",
    a: "Yes. Plans are priced in naira and you can pay by card or bank transfer. No currency conversion, no international card required.",
  },
  {
    q: "What happens if a client never responds?",
    a: "Nothing publishes. The post sits in your queue marked as awaiting approval, and you can see every pending item across all clients in one place, which is usually the nudge you needed anyway.",
  },
  {
    q: "Can I bring my team in?",
    a: "Admins, managers, designers and copywriters each get their own level of access, and you can assign someone to specific clients so they only see those accounts.",
  },
];

export function FAQ() {
  return (
    <RuledSection id="faq" className="scroll-mt-24 py-20 sm:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:gap-20">
        <div>
          <Reveal>
            <SectionLabel>Questions</SectionLabel>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="font-display mt-7 text-[clamp(2.1rem,4.6vw,3.25rem)] text-[rgb(var(--ink))]">
              Before you <span className="italic">ask</span>.
            </h2>
          </Reveal>
        </div>

        <div className="border-t border-[rgb(var(--rule))]">
          {QUESTIONS.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="group border-b border-[rgb(var(--rule))]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-[15.5px] font-medium text-[rgb(var(--ink))] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <PlusIcon
                    className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--ink-faint))] transition-transform duration-300 group-open:rotate-45"
                    strokeWidth={1.75}
                  />
                </summary>
                <p className="max-w-xl pb-6 pr-10 text-[14.5px] leading-relaxed text-[rgb(var(--ink-soft))]">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </RuledSection>
  );
}
