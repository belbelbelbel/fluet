/**
 * Prompt Builder – Maps generation modes to specialized AI instructions
 *
 * Generation modes align with professional content strategies (strategy, viral hook,
 * client voice, carousel, CTA, authority-building, etc.). Each mode augments the
 * system prompt and user prompt so the model produces higher-quality, on-brand content.
 */

export type GenerationMode =
  | "standard"           // Default: platform-optimized content
  | "viral_hook"         // Scroll-stopping hooks (curiosity, authority, pain points)
  | "client_voice"       // Match brand tone, personality, emotional positioning
  | "carousel"           // Instagram carousel: hook slide, value slides, CTA
  | "cta"                // High-converting calls-to-action
  | "authority"          // Thought-leader content, credibility over virality
  | "strategy"           // 30-day content strategy, pillars, post ideas
  | "trend_adaptation"   // Adapt trending topics to niche
  | "content_repurpose"  // Long-form → multi-platform posts
  | "audience_research"; // Act as target audience, psychological triggers

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

/** Base system prompt – minimal, platform-focused */
const BASE_SYSTEM =
  "Expert social media creator. Generate platform-optimized content. Output PLAIN TEXT only - no markdown, asterisks, formatting, or emojis. Ready to copy-paste.";

/** Mode-specific system augmentations – injected before BASE_SYSTEM when mode != standard */
const MODE_SYSTEM_AUGMENT: Record<Exclude<GenerationMode, "standard">, string> = {
  viral_hook:
    "You specialize in scroll-stopping hooks. Use curiosity gaps, authority positioning, emotional pain points, bold claims, and pattern interrupts. Avoid clichés and generic phrases. Optimize for short attention spans and the first 3 seconds.",

  client_voice:
    "You match the brand's exact voice. Analyze tone, personality, emotional positioning, and communication style. Write captions that sound natural, human, and emotionally engaging. Reinforce brand identity consistently.",

  carousel:
    "You create high-engagement Instagram carousels. Structure: strong curiosity-driven hook slide, clear value slides, logical flow, save-worthy final CTA. Optimize for readability, swipe momentum, and audience retention.",

  cta:
    "You generate high-converting calls-to-action. Include a mix of soft engagement CTAs, authority-building prompts, community-driven questions, and subtle conversion-focused CTAs. Avoid generic phrases. Optimize for interaction.",

  authority:
    "You create thought-leader content. Focus on contrarian perspectives, experience-based insights, industry observations, and value-driven storytelling. Prioritize credibility, trust, and long-term brand authority over quick virality.",

  strategy:
    "You act as a senior social media strategist. Create clearly defined content pillars, post ideas per pillar, recommended formats, posting frequency, and success KPIs. Align with growth and conversion, not just engagement.",

  trend_adaptation:
    "You adapt trending topics to a niche. Maintain relevance, originality, and credibility while leveraging the trend's momentum. Include post concepts and caption angles that feel organic and on-brand.",

  content_repurpose:
    "You repurpose long-form content (blog, podcast, video, article) into high-quality social media posts. Adapt tone, structure, hook style, caption length, and CTAs to each platform's best practices.",

  audience_research:
    "You act as the ideal target audience. Identify fears, desires, objections, frustrations, goals, and language patterns. Suggest content ideas that directly address and resonate with these psychological triggers.",
};

/** Platform-specific user prompt templates – format user input per platform */
const PLATFORM_TEMPLATES: Record<
  string,
  (prompt: string, tone: string, style: string, length: string) => string
> = {
  twitter: (p, t, s, l) =>
    `Twitter thread: "${p}". Format: numbered (1/, 2/, 3/). Tone: ${t}. Style: ${s}. Length: ${l}. Include hashtags. NO EMOJIS. Plain text only, no markdown.`,
  instagram: (p, t, s, l) =>
    `Instagram caption: "${p}". Engaging, visual. Tone: ${t}. Style: ${s}. Length: ${l}. Include hashtags. NO EMOJIS. Plain text only.`,
  linkedin: (p, t, s, l) =>
    `LinkedIn post: "${p}". Professional, valuable. Tone: ${t}. Style: ${s}. Length: ${l}. Clear structure. NO EMOJIS. Plain text only.`,
  tiktok: (p, t, s, l) =>
    `TikTok content: "${p}". Script: Hook (0-3s), Body (3-15s), CTA (15-30s). Caption + hashtags. Tone: ${t}. NO EMOJIS. Plain text only.`,
  youtube: (p, t, s, l) =>
    `YouTube video description: "${p}". SEO-optimized, engaging. Tone: ${t}. Style: ${s}. Length: ${l}. Include keywords, timestamps if applicable, call-to-action. NO EMOJIS. Plain text only.`,
};

/** Mode-specific user prompt wrappers – some modes need different framing */
function wrapUserPromptForMode(
  mode: GenerationMode,
  platformPrompt: string,
  userPrompt: string
): string {
  switch (mode) {
    case "viral_hook":
      return `Generate 20 high-impact, scroll-stopping hooks for Instagram and TikTok in this niche: ${userPrompt}. ${platformPrompt}`;
    case "cta":
      return `Generate 10 high-converting calls-to-action for social media content. Topic/niche: ${userPrompt}. ${platformPrompt}`;
    case "carousel":
      return `Create a high-engagement Instagram carousel on this topic: ${userPrompt}. ${platformPrompt}`;
    case "authority":
      return `Create thought-leader style content that positions as an expert. Topic: ${userPrompt}. ${platformPrompt}`;
    case "trend_adaptation":
      return `Take this trending topic and adapt it to my niche in 5 creative ways: ${userPrompt}. Include post concepts and caption angles. ${platformPrompt}`;
    case "content_repurpose":
      return `Repurpose this long-form content into 10 high-quality social media posts for Instagram, LinkedIn, and TikTok: ${userPrompt}. ${platformPrompt}`;
    case "audience_research":
      return `Act as my ideal target audience for: ${userPrompt}. Identify fears, desires, objections, goals, language patterns. Then suggest content ideas that resonate. ${platformPrompt}`;
    case "strategy":
      return `Create a 30-day content strategy. Brand/niche: ${userPrompt}. Include content pillars, post ideas per pillar, formats (Reels, carousels, static), posting frequency, success KPIs. ${platformPrompt}`;
    default:
      return platformPrompt;
  }
}

/** Build brand voice context block for prompt injection */
function buildBrandVoiceBlock(bv: BrandVoiceContext): string {
  const parts: string[] = [];
  if (bv.brandDescription?.trim())
    parts.push(`Brand description: ${bv.brandDescription.trim()}`);
  if (bv.targetAudience?.trim())
    parts.push(`Target audience: ${bv.targetAudience.trim()}`);
  if (bv.industry?.trim()) parts.push(`Industry: ${bv.industry.trim()}`);
  if (bv.tone?.trim()) parts.push(`Tone: ${bv.tone.trim()}`);
  if (bv.slangLevel?.trim() && bv.slangLevel !== "none")
    parts.push(`Slang level: ${bv.slangLevel.trim()}`);
  if (Array.isArray(bv.dos) && bv.dos.length > 0)
    parts.push(`Do: ${bv.dos.join(", ")}`);
  if (Array.isArray(bv.donts) && bv.donts.length > 0)
    parts.push(`Avoid: ${bv.donts.join(", ")}`);
  if (Array.isArray(bv.examplePosts) && bv.examplePosts.length > 0)
    parts.push(`Example posts (match this voice): ${bv.examplePosts.slice(0, 3).join(" | ")}`);
  if (Array.isArray(bv.preferredHashtags) && bv.preferredHashtags.length > 0)
    parts.push(`Preferred hashtags: ${bv.preferredHashtags.join(", ")}`);
  if (Array.isArray(bv.bannedWords) && bv.bannedWords.length > 0)
    parts.push(`Never use these words: ${bv.bannedWords.join(", ")}`);
  if (parts.length === 0) return "";
  return `\n\nBrand voice context (strictly follow):\n${parts.join("\n")}`;
}

/**
 * Build system and user prompts for AI content generation.
 * Combines generation mode, platform, brand voice, and user input.
 */
export function buildPrompt(input: PromptBuildInput): PromptBuildOutput {
  const { mode, userPrompt, platform, tone, style, length, brandVoice } = input;

  // System prompt: mode augmentation (if any) + base
  const modeAugment = mode === "standard" ? "" : MODE_SYSTEM_AUGMENT[mode];
  const systemPrompt =
    modeAugment.trim().length > 0
      ? `${modeAugment}\n\n${BASE_SYSTEM}`
      : BASE_SYSTEM;

  // User prompt: platform template + mode wrapper + brand voice
  const template =
    PLATFORM_TEMPLATES[platform] ?? PLATFORM_TEMPLATES.instagram;
  const platformPrompt = template(userPrompt, tone, style, length);
  let finalUserPrompt = wrapUserPromptForMode(mode, platformPrompt, userPrompt);

  const brandBlock = brandVoice ? buildBrandVoiceBlock(brandVoice) : "";
  if (brandBlock) finalUserPrompt += brandBlock;

  return { systemPrompt, userPrompt: finalUserPrompt };
}

/** Human-readable labels for generation modes (for UI) */
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
