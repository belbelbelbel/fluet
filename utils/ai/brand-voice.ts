/**
 * Professional brand-voice prompting for DeepSeek / LLM caption generation.
 *
 * Research-backed patterns (NN/g tone dimensions, contrast pairs, few-shot,
 * banned AI-default lexicon) — encode voice as rules + examples, not adjectives.
 */

import type { BrandVoiceContext } from "./prompt-builder";

/** Curated tone archetypes with concrete write-rules for social copy */
export const TONE_ARCHETYPES: Record<
  string,
  {
    label: string;
    summary: string;
    /** Contrast pairs: be X, not Y */
    contrasts: string[];
    formality: "low" | "mid" | "high";
    energy: "calm" | "steady" | "high";
    sentenceStyle: string;
  }
> = {
  professional: {
    label: "Professional",
    summary: "Clear, credible, business-ready. Warm enough to feel human.",
    contrasts: [
      "Confident, not arrogant",
      "Clear, not stiff",
      "Helpful, not salesy",
    ],
    formality: "high",
    energy: "steady",
    sentenceStyle:
      "Prefer short-to-medium sentences. Lead with the point. Light contractions OK.",
  },
  authoritative: {
    label: "Authoritative expert",
    summary: "Thought-leader energy. Opinionated, evidence-led, sparse hype.",
    contrasts: [
      "Direct, not aggressive",
      "Expert, not condescending",
      "Specific, not vague",
    ],
    formality: "high",
    energy: "steady",
    sentenceStyle:
      "Strong opening claim. Concrete examples over buzzwords. Minimal fluff.",
  },
  friendly: {
    label: "Friendly & warm",
    summary: "Approachable peer. Conversational without becoming slangy.",
    contrasts: [
      "Warm, not overly familiar",
      "Supportive, not preachy",
      "Casual, not sloppy",
    ],
    formality: "mid",
    energy: "steady",
    sentenceStyle: "Contractions welcome. Talk like a helpful friend. One idea per beat.",
  },
  casual: {
    label: "Casual",
    summary: "Relaxed everyday voice. Still clear and brand-safe.",
    contrasts: [
      "Relaxed, not careless",
      "Fun, not try-hard",
      "Simple, not dumbed-down",
    ],
    formality: "low",
    energy: "steady",
    sentenceStyle: "Short lines. Natural spoken rhythm. Skip corporate filler.",
  },
  witty: {
    label: "Witty / sharp",
    summary: "Smart humor and pattern interrupts — never mean or meme-spam.",
    contrasts: [
      "Clever, not cringe",
      "Playful, not chaotic",
      "Punchy, not mean",
    ],
    formality: "mid",
    energy: "high",
    sentenceStyle: "Hook with tension or twist. Keep jokes tight. Never force slang.",
  },
  funny: {
    label: "Funny",
    summary: "Light comedy that still serves the message.",
    contrasts: [
      "Amusing, not random",
      "Relatable, not insulting",
      "Light, not unserious about the product",
    ],
    formality: "low",
    energy: "high",
    sentenceStyle: "Setup → punch. Keep the brand benefit clear under the joke.",
  },
  inspiring: {
    label: "Inspiring",
    summary: "Motivational without empty hustle-speak.",
    contrasts: [
      "Uplifting, not preachy",
      "Aspirational, not fake-positive",
      "Emotionally honest, not dramatic",
    ],
    formality: "mid",
    energy: "high",
    sentenceStyle: "Concrete hope + next step. Avoid empty slogans.",
  },
  educational: {
    label: "Educational mentor",
    summary: "Teach something useful in plain language.",
    contrasts: [
      "Clear, not academic",
      "Practical, not theoretical",
      "Patient, not patronizing",
    ],
    formality: "mid",
    energy: "calm",
    sentenceStyle: "One insight → why it matters → how to apply. Prefer lists of 3.",
  },
  luxury: {
    label: "Premium / luxury",
    summary: "Sparse, refined, high-status calm.",
    contrasts: [
      "Elegant, not flashy",
      "Selective, not exclusive-arrogant",
      "Quiet confidence, not hype",
    ],
    formality: "high",
    energy: "calm",
    sentenceStyle: "Fewer words. Precise nouns. No slang, no urgency gimmicks.",
  },
  bold: {
    label: "Bold / disruptive",
    summary: "Strong POV that challenges the status quo.",
    contrasts: [
      "Bold, not reckless",
      "Provocative, not offensive",
      "Clear stance, not rage-bait",
    ],
    formality: "mid",
    energy: "high",
    sentenceStyle: "Open with a sharp claim. Back it. Invite agreement or debate.",
  },
  formal: {
    label: "Formal",
    summary: "Polished institutional voice for serious audiences.",
    contrasts: [
      "Formal, not cold",
      "Precise, not wordy",
      "Respectful, not distant",
    ],
    formality: "high",
    energy: "calm",
    sentenceStyle: "Complete sentences. Minimal slang. Careful claims.",
  },
};

/** Generic AI filler DeepSeek/GPT defaults to — always ban for brand copy */
export const DEFAULT_AI_BANNED_PHRASES = [
  "delve",
  "leverage",
  "utilize",
  "unlock",
  "elevate",
  "empower",
  "seamless",
  "cutting-edge",
  "game-changer",
  "revolutionize",
  "in today's digital landscape",
  "at the end of the day",
  "it's important to note",
  "nestled",
  "tapestry",
  "realm",
  "foster",
  "robust",
  "synergy",
  "navigate the",
];

const SLANG_RULES: Record<string, string> = {
  none: "Use clear international English. No Pidgin, no heavy slang.",
  light:
    "Mostly clear English. At most 1 light Nigerian expression if it fits naturally (e.g. 'abeg', 'sharp'). Never force it.",
  moderate:
    "Natural mix of English + light Pidgin. Sound like a real Nigerian creator — not a tourist phrase-dump.",
  heavy:
    "Comfortable Pidgin-forward voice is OK when it fits the brand. Stay clear and readable; don't make every line slang.",
};

function normalizeToneKey(tone?: string | null): string {
  const t = (tone || "").toLowerCase().trim();
  if (!t) return "professional";
  if (t === "funny") return "funny";
  if (TONE_ARCHETYPES[t]) return t;
  // fuzzy map common UI values
  if (t.includes("expert") || t.includes("authority")) return "authoritative";
  if (t.includes("luxury") || t.includes("premium")) return "luxury";
  if (t.includes("wit") || t.includes("sharp")) return "witty";
  if (t.includes("inspire") || t.includes("motivat")) return "inspiring";
  if (t.includes("educat") || t.includes("mentor")) return "educational";
  if (t.includes("bold") || t.includes("disrupt")) return "bold";
  if (t.includes("friend")) return "friendly";
  if (t.includes("casual")) return "casual";
  if (t.includes("formal")) return "formal";
  if (t.includes("profession")) return "professional";
  return "professional";
}

function hasUsableBrandVoice(bv: BrandVoiceContext | null | undefined): boolean {
  if (!bv) return false;
  return !!(
    bv.brandDescription?.trim() ||
    bv.targetAudience?.trim() ||
    bv.tone?.trim() ||
    bv.industry?.trim() ||
    (Array.isArray(bv.examplePosts) && bv.examplePosts.some((p) => p?.trim())) ||
    (Array.isArray(bv.dos) && bv.dos.length > 0) ||
    (Array.isArray(bv.donts) && bv.donts.length > 0)
  );
}

/**
 * Build a dense system-prompt block that DeepSeek can follow reliably.
 * Returns empty string when no brand data is worth injecting.
 */
export function buildBrandVoiceSystemBlock(
  bv: BrandVoiceContext | null | undefined,
  platform: string
): string {
  if (!hasUsableBrandVoice(bv) || !bv) return "";

  const toneKey = normalizeToneKey(bv.tone);
  const archetype = TONE_ARCHETYPES[toneKey] || TONE_ARCHETYPES.professional;
  const slang = SLANG_RULES[bv.slangLevel || "none"] || SLANG_RULES.none;

  const banned = [
    ...DEFAULT_AI_BANNED_PHRASES,
    ...(Array.isArray(bv.bannedWords)
      ? bv.bannedWords.map((w) => String(w).trim()).filter(Boolean)
      : []),
  ];
  const uniqueBanned = Array.from(new Set(banned.map((w) => w.toLowerCase())));

  const lines: string[] = [
    "BRAND VOICE (non-negotiable — write AS this brand, not as a generic AI):",
    `Voice archetype: ${archetype.label} — ${archetype.summary}`,
    `Tone contrasts: ${archetype.contrasts.join("; ")}.`,
    `Sentence style: ${archetype.sentenceStyle}`,
    `Language: ${slang}`,
  ];

  if (bv.brandDescription?.trim()) {
    lines.push(`Brand identity: ${bv.brandDescription.trim()}`);
  }
  if (bv.targetAudience?.trim()) {
    lines.push(
      `Audience: ${bv.targetAudience.trim()}. Speak to their goals and pains; never talk past them.`
    );
  }
  if (bv.industry?.trim()) {
    lines.push(`Category/industry: ${bv.industry.trim()}`);
  }

  if (Array.isArray(bv.dos) && bv.dos.length > 0) {
    lines.push(`Always do: ${bv.dos.filter(Boolean).join("; ")}`);
  }
  if (Array.isArray(bv.donts) && bv.donts.length > 0) {
    lines.push(`Never do: ${bv.donts.filter(Boolean).join("; ")}`);
  }

  lines.push(`Never use these words/phrases: ${uniqueBanned.join(", ")}`);

  if (Array.isArray(bv.preferredHashtags) && bv.preferredHashtags.length > 0) {
    lines.push(
      `Prefer these hashtags when relevant (don't spam): ${bv.preferredHashtags.join(", ")}`
    );
  }

  // Few-shot examples — highest signal for voice matching
  const examples = (bv.examplePosts || [])
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .slice(0, 3);
  if (examples.length > 0) {
    lines.push("On-brand examples (match this rhythm, diction, and attitude):");
    examples.forEach((ex, i) => lines.push(`  [${i + 1}] ${ex}`));
  } else {
    lines.push(
      "No example posts provided — still obey tone contrasts, bans, and identity above."
    );
  }

  // Platform-specific voice modifiers
  const p = platform.toLowerCase();
  if (p === "twitter" || p === "x") {
    lines.push(
      "Channel fit (X/Twitter): Hook in line 1. One idea. Punchy. Threads only if needed."
    );
  } else if (p === "linkedin") {
    lines.push(
      "Channel fit (LinkedIn): Professional value first. Short paragraphs. Soft CTA. No slang unless brand slang says so."
    );
  } else if (p === "instagram") {
    lines.push(
      "Channel fit (Instagram): Visual-first caption. Strong first line. Scannable. Hashtags at end."
    );
  } else if (p === "tiktok") {
    lines.push(
      "Channel fit (TikTok): Spoken script energy. Hook in 0–3s. Caption stays on-voice."
    );
  }

  lines.push(
    "Self-check before output: Would a follower recognize this as THIS brand — or as generic AI? If generic, rewrite."
  );

  return lines.join("\n");
}

/** Prefer brand tone over UI tone when brand voice is set */
export function resolveEffectiveTone(
  requestTone: string | undefined,
  brandVoice?: BrandVoiceContext | null
): string {
  if (brandVoice?.tone?.trim()) {
    return normalizeToneKey(brandVoice.tone);
  }
  return normalizeToneKey(requestTone || "professional");
}

export function brandVoiceIsActive(
  bv: BrandVoiceContext | null | undefined
): boolean {
  return hasUsableBrandVoice(bv);
}

/** Options for brand-voice UI select */
export const BRAND_TONE_OPTIONS = Object.entries(TONE_ARCHETYPES).map(
  ([id, meta]) => ({
    id,
    label: meta.label,
    description: meta.summary,
  })
);
