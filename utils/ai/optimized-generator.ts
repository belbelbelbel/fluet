/**
 * Professional AI Content Generator
 * DeepSeek-first (OpenAI-compatible). Optimized for captions + social copy.
 */

import { buildPrompt } from "./prompt-builder";
import type { GenerationMode, BrandVoiceContext } from "./prompt-builder";
import {
  DEEPSEEK_MODELS,
  DEEPSEEK_TOKEN_COSTS,
  getChatClient,
  getAIProvider,
  resolveModelId,
} from "./client";

interface GenerationOptions {
  contentType: string;
  tone: string;
  style: string;
  length: string;
  usePremium?: boolean;
  maxRetries?: number;
  generationMode?: GenerationMode;
  brandVoice?: BrandVoiceContext | null;
  /** Optional override from user settings */
  modelId?: string | null;
}

interface GenerationResult {
  content: string;
  tokensUsed: number;
  model: string;
  cost: number;
}

export class OptimizedAIGenerator {
  private cache: Map<string, string> = new Map();

  /**
   * Generate content with intelligent model selection and cost optimization
   */
  async generate(
    prompt: string,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const cacheKey = this.getCacheKey(prompt, options);
    if (this.cache.has(cacheKey)) {
      console.log("[AI] Cache hit - returning cached content");
      return {
        content: this.cache.get(cacheKey)!,
        tokensUsed: 0,
        model: "cache",
        cost: 0,
      };
    }

    const model = this.selectModel(options);
    const maxRetries = options.maxRetries || 3;

    const { systemPrompt, userPrompt } = buildPrompt({
      mode: options.generationMode ?? "standard",
      userPrompt: prompt,
      platform: options.contentType,
      tone: options.tone,
      style: options.style,
      length: options.length,
      brandVoice: options.brandVoice ?? null,
    });

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.callAPI(systemPrompt, userPrompt, model, options);
        this.cache.set(cacheKey, result.content);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[AI] Attempt ${attempt}/${maxRetries} failed:`, error);

        if (this.isRateLimitError(error)) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(waitTime);
          continue;
        }

        if (attempt === maxRetries) {
          throw new Error(
            `AI generation failed after ${maxRetries} attempts: ${lastError.message}`
          );
        }
      }
    }

    throw lastError || new Error("AI generation failed");
  }

  private async callAPI(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const client = getChatClient();
    const provider = getAIProvider();

    // DeepSeek V4 defaults thinking=enabled. Reasoning tokens count against
    // max_tokens and often leave message.content empty → "No content generated".
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: this.getTemperature(options.tone),
      max_tokens: this.getMaxTokens(options.length, options),
      ...(provider === "deepseek"
        ? ({ thinking: { type: "disabled" } } as object)
        : {}),
    });

    const duration = Date.now() - startTime;
    const message = completion.choices[0]?.message as
      | { content?: string | null; reasoning_content?: string | null }
      | undefined;
    const raw =
      (message?.content && String(message.content).trim()) ||
      (message?.reasoning_content && String(message.reasoning_content).trim()) ||
      "";

    if (!raw) {
      const finish = completion.choices[0]?.finish_reason;
      console.warn(
        `[AI] Empty content from ${provider} model=${model} finish=${finish} usage=${JSON.stringify(completion.usage)}`
      );
      throw new Error(
        `No content generated from ${provider}${finish ? ` (${finish})` : ""}`
      );
    }

    const cleaned = this.cleanContent(raw);
    if (!cleaned.trim()) {
      throw new Error(
        `AI returned content but it was empty after cleanup (${provider})`
      );
    }

    const tokensUsed = completion.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokensUsed, model, completion.usage);

    console.log(
      `[AI] ${provider} ${duration}ms | Model: ${model} | Tokens: ${tokensUsed} | Cost: $${cost.toFixed(4)}`
    );

    return {
      content: cleaned,
      tokensUsed,
      model,
      cost,
    };
  }

  private selectModel(options: GenerationOptions): string {
    const complexModes: GenerationMode[] = [
      "strategy",
      "audience_research",
      "content_repurpose",
    ];
    const wantPremium =
      !!options.usePremium ||
      options.length === "long" ||
      !!(options.generationMode && complexModes.includes(options.generationMode));

    return resolveModelId(options.modelId, { premium: wantPremium });
  }

  private getTemperature(tone: string): number {
    const tempMap: Record<string, number> = {
      professional: 0.7,
      casual: 0.8,
      funny: 0.9,
      inspiring: 0.85,
      educational: 0.75,
    };
    return tempMap[tone] || 0.8;
  }

  private getMaxTokens(length: string, options: GenerationOptions): number {
    const baseMap: Record<string, number> = {
      short: 300,
      medium: 700,
      long: 1400,
    };
    const base = baseMap[length] || 500;
    const highOutputModes: GenerationMode[] = [
      "viral_hook",
      "cta",
      "strategy",
      "audience_research",
      "content_repurpose",
    ];
    if (options.generationMode && highOutputModes.includes(options.generationMode)) {
      return Math.max(base, 1200);
    }
    return base;
  }

  private calculateCost(
    totalTokens: number,
    model: string,
    usage: { prompt_tokens?: number; completion_tokens?: number } | undefined
  ): number {
    const costs =
      DEEPSEEK_TOKEN_COSTS[model] ||
      (model === DEEPSEEK_MODELS.flash
        ? DEEPSEEK_TOKEN_COSTS["deepseek-v4-flash"]
        : null);
    if (!costs) return 0;

    const inputTokens = usage?.prompt_tokens || totalTokens * 0.7;
    const outputTokens = usage?.completion_tokens || totalTokens * 0.3;
    return (
      (inputTokens / 1_000_000) * costs.input +
      (outputTokens / 1_000_000) * costs.output
    );
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s*[—–]\s*(?=\d)/g, ", ")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`(.*?)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/^\s*[\*\-\+]\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "")
      .replace(/[\u2600-\u26FF]/g, "")
      .replace(/[\u2700-\u27BF]/g, "")
      .replace(/\uD83D[\uDE80-\uDEFF]/g, "")
      .replace(/\uD83C[\uDDE0-\uDDFF]/g, "")
      .replace(/\uD83E[\uDD00-\uDDFF]/g, "")
      .trim();
  }

  private getCacheKey(prompt: string, options: GenerationOptions): string {
    const mode = options.generationMode ?? "standard";
    return `${options.contentType}:${mode}:${options.tone}:${options.style}:${options.length}:${prompt.slice(0, 100)}`;
  }

  private isRateLimitError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes("rate limit") || error.message.includes("429"))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

let generatorInstance: OptimizedAIGenerator | null = null;

export function getAIGenerator(): OptimizedAIGenerator {
  if (!generatorInstance) {
    generatorInstance = new OptimizedAIGenerator();
  }
  return generatorInstance;
}
