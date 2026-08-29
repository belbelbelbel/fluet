/**
 * Prompt Builder. Maps generation modes to specialized AI instructions
 * Brand voice is injected into the SYSTEM prompt (persona) for DeepSeek fidelity.
 */

import {
  buildBrandVoiceSystemBlock,
  brandVoiceIsActive,
  resolveEffectiveTone,
} from "./brand-voice";

export type GenerationMode =
  | "standard"
  | "viral_hook"
  | "client_voice"
  | "carousel"
  | "cta"
  | "authority"
  | "strategy"
  | "trend_adaptation"
  | "content_repurpose"
  | "audience_research";

/** Brand voice context from ClientBrandVoice (used when generating for a client) */
export interface BrandVoiceContext {
  brandDescription?: string | null;
  targetAudience?: string | null;
  tone?: string | null;
  industry?: string | null;
  slangLevel?: string | null;
  dos?: string[] | null;
  donts?: string[] | null;
  examplePosts?: string[] | null;
  preferredHashtags?: string[] | null;
  bannedWords?: string[] | null;
}

export interface PromptBuildInput {
  mode: GenerationMode;
  userPrompt: string;
  platform: string;
  tone: string;
  style: string;
  length: string;
  brandVoice?: BrandVoiceContext | null;
}

export interface PromptBuildOutput {
  systemPrompt: string;
  userPrompt: string;
}

const BASE_SYSTEM = `You are a senior social media copywriter for agencies.
Output PLAIN TEXT only. No markdown, no asterisks, no bullet markers, no emojis unless the brand voice explicitly allows them.
Never use an em dash (—) or en dash (–). Use a comma or a full stop instead. They read as AI-written.
Write copy ready to paste into the platform.
Never sound like generic AI marketing. Prefer concrete language, specificity, and a human ear.`;

const MODE_SYSTEM_AUGMENT: Record<Exclude<GenerationMode, "standard">, string> = {
  viral_hook:
    "Specialize in scroll-stopping hooks: curiosity gaps, authority, pain points, pattern interrupts. First line must earn the next second. Avoid clichés.",

  client_voice:
    "Brand voice is the product. Prioritize voice match over virality. If a line is clever but off-brand, cut it. Sound like a real person from this brand.",

  carousel:
    "Instagram carousel structure: curiosity hook slide → clear value slides → save-worthy CTA. Scannable lines. Logical swipe flow.",

  cta:
    "High-converting CTAs: soft engagement, authority prompts, community questions, light conversion. Specific actions, never 'click here' emptiness.",

  authority:
    "Thought-leader content: contrarian insight, experience, industry observation. Credibility over hype. Specific claims over slogans.",

  strategy:
    "Senior strategist mode: pillars, post ideas, formats, frequency, KPIs. Practical and conversion-aware.",

  trend_adaptation:
    "Adapt trends to the niche without cringe. Keep originality and brand credibility.",

  content_repurpose:
    "Turn long-form into platform-native posts. Adapt hook, length, and CTA per channel.",

  audience_research:
    "Speak as the ideal customer: fears, desires, objections, language. Then suggest content that hits those triggers.",
};

const PLATFORM_TEMPLATES: Record<
  string,
  (prompt: string, tone: string, style: string, length: string) => string
> = {
  twitter: (p, t, s, l) =>
    `Write an X/Twitter post (or short thread if needed) about: "${p}".
Requirements: Tone=${t}. Style=${s}. Length=${l}.
Hook in the first line. Number threads as 1/ 2/ 3/ only if multiple tweets.
Include 1-3 relevant hashtags at the end. Plain text only.`,
  instagram: (p, t, s, l) =>
    `Write an Instagram caption about: "${p}".
Requirements: Tone=${t}. Style=${s}. Length=${l}.
Strong first line. Scannable body. Hashtags at the end. Plain text only.`,
  linkedin: (p, t, s, l) =>
    `Write a LinkedIn post about: "${p}".
Requirements: Tone=${t}. Style=${s}. Length=${l}.
Lead with insight. Short paragraphs. Soft CTA. Plain text only.`,
  tiktok: (p, t, s, l) =>
    `Write a TikTok script + caption about: "${p}".
Structure: Hook (0-3s), Body (3-15s), CTA (15-30s), then caption + hashtags.
Tone=${t}. Style=${s}. Length=${l}. Plain text only.`,
  youtube: (p, t, s, l) =>
    `Write a YouTube description about: "${p}".
SEO-aware, engaging, clear CTA. Tone=${t}. Style=${s}. Length=${l}. Plain text only.`,
};

function wrapUserPromptForMode(
  mode: GenerationMode,
  platformPrompt: string,
  userPrompt: string
): string {
  switch (mode) {
    case "viral_hook":
      return `Generate 12 high-impact hooks for this topic/niche: ${userPrompt}.\n${platformPrompt}`;
    case "cta":
      return `Generate 8 high-converting CTAs for: ${userPrompt}.\n${platformPrompt}`;
    case "carousel":
      return `Create a high-engagement Instagram carousel on: ${userPrompt}.\n${platformPrompt}`;
    case "authority":
      return `Create thought-leader content on: ${userPrompt}.\n${platformPrompt}`;
    case "trend_adaptation":
      return `Adapt this trend/topic to the brand niche in 5 angles: ${userPrompt}.\n${platformPrompt}`;
    case "content_repurpose":
      return `Repurpose into platform-ready posts: ${userPrompt}.\n${platformPrompt}`;
    case "audience_research":
      return `Audience research then content ideas for: ${userPrompt}.\n${platformPrompt}`;
    case "strategy":
      return `30-day content strategy for: ${userPrompt}. Pillars, ideas, formats, frequency, KPIs.\n${platformPrompt}`;
    case "client_voice":
      return `Write this entirely in the brand voice profile (system). Topic: ${userPrompt}.\n${platformPrompt}`;
    default:
      return platformPrompt;
  }
}

/**
 * Build system and user prompts for AI content generation.
 */
export function buildPrompt(input: PromptBuildInput): PromptBuildOutput {
  const { mode, userPrompt, platform, style, length, brandVoice } = input;

  const effectiveTone = resolveEffectiveTone(input.tone, brandVoice);
  const voiceActive = brandVoiceIsActive(brandVoice);

  // When a client has brand voice, treat every generation as voice-aware
  const effectiveMode: GenerationMode =
    voiceActive && mode === "standard" ? "client_voice" : mode;

  const modeAugment =
    effectiveMode === "standard" ? "" : MODE_SYSTEM_AUGMENT[effectiveMode];

  const brandSystem = buildBrandVoiceSystemBlock(brandVoice, platform);

  const systemParts = [
    modeAugment.trim(),
    BASE_SYSTEM,
    brandSystem,
    voiceActive
      ? "If brand voice conflicts with a generic trend/format request, brand voice wins."
      : "",
  ].filter(Boolean);

  const systemPrompt = systemParts.join("\n\n");

  const template =
    PLATFORM_TEMPLATES[platform] ?? PLATFORM_TEMPLATES.instagram;
  const platformPrompt = template(userPrompt, effectiveTone, style, length);
  let finalUserPrompt = wrapUserPromptForMode(
    effectiveMode,
    platformPrompt,
    userPrompt
  );

  if (voiceActive) {
    finalUserPrompt += `\n\nReminder: stay inside the brand voice rules from the system message. Match example posts if provided.`;
  }

  return { systemPrompt, userPrompt: finalUserPrompt };
}

export const GENERATION_MODE_LABELS: Record<GenerationMode, string> = {
  standard: "Standard",
  viral_hook: "Viral Hooks",
  client_voice: "Client Voice",
  carousel: "Carousel",
  cta: "Call-to-Action",
  authority: "Authority Building",
  strategy: "Strategy",
  trend_adaptation: "Trend Adaptation",
  content_repurpose: "Content Repurpose",
  audience_research: "Audience Research",
};
