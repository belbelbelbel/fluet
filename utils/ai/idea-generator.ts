/**
 * AI-powered content ideas generator for custom niches
 * Uses strategic frameworks (educational, BTS, testimonial, etc.) for diverse, high-quality ideas
 */

import type { ContentIdea, Niche, HookStyle, Format, ContentStrategy } from "@/lib/content-ideas";
import { DEEPSEEK_MODELS, getChatClient } from "./client";

/** Flash is best for batch idea JSON — fast + cheap */
const MODEL = DEEPSEEK_MODELS.flash;

const HOOK_STYLES: HookStyle[] = ["story", "question", "shock", "value", "tip"];
const FORMATS: Format[] = ["text_only", "text_image", "carousel", "video"];
const STRATEGIES: ContentStrategy[] = [
  "viral_hook",
  "authority",
  "trend_adaptation",
  "audience_research",
  "carousel",
  "cta",
  "client_voice",
];

const SYSTEM_PROMPT = `You are an expert Nigerian social media content strategist. You create scroll-stopping, conversion-focused content ideas for Instagram and TikTok.

Your ideas MUST:
1. Use Nigerian audience language (mix of English and Pidgin where appropriate)
2. Include naijaTone variants: mild (professional English), moderate (light Pidgin), heavy (full Pidgin)
3. Have compelling hook examples that stop the scroll
4. Align with proven content strategies (viral hooks, authority, testimonials, etc.)

Output valid JSON only. No markdown, no explanation.`;

const USER_PROMPT_TEMPLATE = `Generate 10 content ideas for this Nigerian business niche: "{niche}"

Use these frameworks for diversity (2 ideas each):
- 2 educational tips (teach something valuable)
- 2 behind-the-scenes (show your process, authenticity)
- 2 client testimonial / success story style
- 2 myth-busting or common-mistake style
- 2 engagement-driven (questions, polls, challenges)

Each idea MUST have:
- topic: short catchy topic (e.g. "Quick breakfast ideas")
- hookStyle: one of story, question, shock, value, tip
- hookExample: scroll-stopping hook text (e.g. "The one thing that changed my breakfast routine...")
- format: one of text_only, text_image, carousel, video
- strategy: one of viral_hook, authority, trend_adaptation, audience_research, carousel, cta, client_voice
- strategyTip: one sentence on why this works
- description: one sentence describing the post
- naijaTone: object with mild, moderate, heavy - each a 1-2 sentence caption sample for that tone

Return a JSON array of exactly 10 objects. No other text.`;

export interface GenerateIdeasResult {
  ideas: ContentIdea[];
  tokensUsed: number;
}

export async function generateContentIdeasForNiche(
  nicheDescription: string
): Promise<GenerateIdeasResult> {
  const client = getChatClient();

  const userPrompt = USER_PROMPT_TEMPLATE.replace(
    "{niche}",
    nicheDescription.trim() || "small business in Nigeria"
  );

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 4000,
    // DeepSeek V4: disable thinking so JSON lands in content, not only reasoning
    ...({ thinking: { type: "disabled" } } as object),
  });

  const message = completion.choices[0]?.message as
    | { content?: string | null; reasoning_content?: string | null }
    | undefined;
  const content =
    (message?.content && String(message.content).trim()) ||
    (message?.reasoning_content && String(message.reasoning_content).trim()) ||
    "";
  if (!content) {
    throw new Error("No content generated from AI");
  }

  const tokensUsed = completion.usage?.total_tokens || 0;

  // Parse JSON (handle potential markdown code block)
  let raw: unknown;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    raw = JSON.parse(jsonMatch[0]);
  } else {
    raw = JSON.parse(content);
  }

  if (!Array.isArray(raw)) {
    throw new Error("AI did not return an array of ideas");
  }

  const ideas: ContentIdea[] = raw.slice(0, 10).map((item: Record<string, unknown>, i: number) => {
    const getStr = (k: string, d: string) =>
      typeof item[k] === "string" ? (item[k] as string) : d;
    const getObj = (k: string) => (item[k] && typeof item[k] === "object" ? (item[k] as Record<string, string>) : {});

    const nt = getObj("naijaTone");
    const hookStyle = HOOK_STYLES.includes(item.hookStyle as HookStyle) ? (item.hookStyle as HookStyle) : "value";
    const format = FORMATS.includes(item.format as Format) ? (item.format as Format) : "text_image";
    const strategy = STRATEGIES.includes(item.strategy as ContentStrategy) ? (item.strategy as ContentStrategy) : "client_voice";

    return {
      id: `ai_${Date.now()}_${i}`,
      niche: "custom" as Niche,
      topic: getStr("topic", "Content idea"),
      hookStyle,
      hookExample: getStr("hookExample", "Check this out..."),
      format,
      strategy,
      strategyTip: getStr("strategyTip", "Engaging content that resonates"),
      naijaTone: {
        mild: nt.mild || "Share valuable content with your audience.",
        moderate: nt.moderate || "Abeg, share this valuable content with your people.",
        heavy: nt.heavy || "See valuable content wey you fit share.",
      },
      description: getStr("description", "Engaging post for your audience"),
    };
  });

  return { ideas, tokensUsed };
}
