"use client";

import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { RuledSection, SectionLabel } from "./Frame";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "Approval workflow",
    body: "Every post carries its own review link. Clients confirm their identity by email before a decision is recorded, so an approval is genuinely theirs.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Client dashboards",
    body: "Each client sees what's scheduled, what's live and what needs them — the thing that makes a two-person agency look like a twenty-person one.",
  },
  {
    icon: CalendarClockIcon,
    title: "Scheduling that publishes",
    body: "Approved posts go out automatically on Instagram, X and YouTube. LinkedIn and TikTok send you a reminder instead — their APIs don't allow the rest.",
  },
  {
    icon: UsersIcon,
    title: "Team roles & assignment",
    body: "Admins, managers, designers and copywriters. Assign people to specific clients and they only ever see those.",
  },
  {
    icon: CircleDollarSignIcon,
    title: "Payment tracking",
    body: "See which retainers are paid and which are overdue next to the work itself, so you stop producing for accounts that stopped paying.",
  },
  {
    icon: SparklesIcon,
    title: "Content drafting",
    body: "Generate first drafts in each client's brand voice. It's a starting point for your writers, not a replacement for them.",
  },
];

export function Features() {
  return (
    <RuledSection id="features" className="py-20 sm:py-24">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <div>
          <Reveal>
            <SectionLabel>What&apos;s inside</SectionLabel>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="font-display mt-7 text-[clamp(2.1rem,4.6vw,3.25rem)] text-[rgb(var(--ink))]">
              Built around the part that
              <br className="hidden sm:block" /> actually{" "}
              <span className="italic">costs you hours</span>.
            </h2>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <p className="max-w-md text-[15px] leading-relaxed text-[rgb(var(--ink-soft))] md:pb-2">
            Scheduling tools assume one brand and one approver. Agencies run
            three to ten clients, each with their own reviewer, calendar and
            invoice. Revvy is shaped for that.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-[rgb(var(--rule))] sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.title} delay={(i % 3) * 80}>
              <div className="group h-full bg-[rgb(var(--canvas))] p-7 transition-colors duration-300 hover:bg-[rgb(var(--surface))] sm:p-8">
                <Icon
                  className="h-[18px] w-[18px] text-[rgb(var(--accent))]"
                  strokeWidth={1.75}
                />
                <h3 className="mt-5 text-[16.5px] font-medium text-[rgb(var(--ink))]">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[rgb(var(--ink-soft))]">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </RuledSection>
  );
}
