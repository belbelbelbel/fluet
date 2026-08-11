"use client";

import { cn } from "@/lib/utils";

interface ClientAvatarProps {
  name: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { box: "w-7 h-7 text-[11px]", img: "w-7 h-7" },
  md: { box: "w-10 h-10 text-sm", img: "w-10 h-10" },
  lg: { box: "w-12 h-12 text-base", img: "w-12 h-12" },
};

const AVATAR_PALETTE = [
  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600",
  "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/80 dark:text-stone-200 dark:border-stone-600",
  "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-200 dark:border-zinc-600",
  "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-200 dark:border-neutral-600",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function paletteForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function ClientAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: ClientAvatarProps) {
  const sizes = sizeClasses[size];

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn(
          sizes.img,
          "rounded-lg object-cover border border-gray-200 dark:border-slate-600 shrink-0",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizes.box,
        "rounded-lg border flex items-center justify-center font-medium shrink-0 tracking-tight",
        paletteForName(name),
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
