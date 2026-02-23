/**
 * Professional AI Content Generator
 * Optimized for cost, quality, and token efficiency
 * Uses prompt-builder for generation modes (viral hook, client voice, carousel, etc.)
 */

import OpenAI from "openai";
import { buildPrompt } from "./prompt-builder";
import type { GenerationMode, BrandVoiceContext } from "./prompt-builder";

// Cost-optimized model selection based on content complexity
const MODEL_CONFIG = {
  primary: "gpt-4o-mini",
  fallback: "gpt-3.5-turbo",
  premium: "gpt-4o",
} as const;

interface GenerationOptions {
  contentType: string;
  tone: string;
  style: string;
  length: string;
  usePremium?: boolean;
  maxRetries?: number;
  generationMode?: GenerationMode;
  brandVoice?: BrandVoiceContext | null;
}

interface GenerationResult {
  content: string;
  tokensUsed: number;
  model: string;
  cost: number;
}

// Token cost per 1K tokens (as of 2024 pricing)
const TOKEN_COSTS = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 }, // $0.15/$0.60 per 1M tokens
  "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  "gpt-4o": { input: 2.50, output: 10.00 },
} as const;

export class OptimizedAIGenerator {
  private openai: OpenAI;
  private cache: Map<string, string> = new Map();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate content with intelligent model selection and cost optimization
   */
  async generate(
    prompt: string,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    // Check cache first (cache key based on prompt + options)
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

    // Select optimal model based on content complexity
    const model = this.selectModel(options);
    const maxRetries = options.maxRetries || 3;

    // Build prompts via prompt-builder (handles generation modes + brand voice)
    const { systemPrompt, userPrompt } = buildPrompt({
      mode: options.generationMode ?? "standard",
      userPrompt: prompt,
      platform: options.contentType,
      tone: options.tone,
      style: options.style,
      length: options.length,
      brandVoice: options.brandVoice ?? null,
    });

    // Generate with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.callAPI(systemPrompt, userPrompt, model, options);
        
        // Cache successful results
        this.cache.set(cacheKey, result.content);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[AI] Attempt ${attempt}/${maxRetries} failed:`, error);

        // If rate limited, wait with exponential backoff
        if (this.isRateLimitError(error)) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(waitTime);
          continue;
        }

        // If quota exceeded, try fallback model
        if (this.isQuotaError(error) && model !== MODEL_CONFIG.fallback) {
          console.log("[AI] Quota exceeded, trying fallback model");
          return this.generate(prompt, { ...options, usePremium: false });
        }

        // If last attempt, throw error
        if (attempt === maxRetries) {
          throw new Error(`AI generation failed after ${maxRetries} attempts: ${lastError.message}`);
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

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: this.getTemperature(options.tone),
      max_tokens: this.getMaxTokens(options.length, options),
      // Response format optimization
      response_format: { type: "text" },
    });

    const duration = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    // Calculate token usage and cost
    const tokensUsed = completion.usage?.total_tokens || 0;
    const cost = this.calculateCost(tokensUsed, model, completion.usage);

    console.log(`[AI] Generated content in ${duration}ms | Model: ${model} | Tokens: ${tokensUsed} | Cost: $${cost.toFixed(4)}`);

    // Clean content (remove any markdown that slipped through)
    const cleanedContent = this.cleanContent(content);

    return {
      content: cleanedContent,
      tokensUsed,
      model,
      cost,
    };
  }

  private selectModel(options: GenerationOptions): string {
    if (options.usePremium || options.length === "long") {
      return MODEL_CONFIG.premium;
    }
    const complexModes: GenerationMode[] = ["strategy", "audience_research", "content_repurpose"];
    if (options.generationMode && complexModes.includes(options.generationMode)) {
      return MODEL_CONFIG.premium;
    }
    return MODEL_CONFIG.primary;
  }

  private getTemperature(tone: string): number {
    // Optimize temperature for different tones (reduces retries)
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
      short: 200,
      medium: 500,
      long: 1000,
    };
    const base = baseMap[length] || 500;
    const highOutputModes: GenerationMode[] = ["viral_hook", "cta", "strategy", "audience_research", "content_repurpose"];
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
    const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS];
    if (!costs) return 0;

    const inputTokens = usage?.prompt_tokens || totalTokens * 0.7;
    const outputTokens = usage?.completion_tokens || totalTokens * 0.3;

    // Convert to cost per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return inputCost + outputCost;
  }

  private cleanContent(content: string): string {
    // Remove markdown formatting and emojis (optimized regex)
    return content
      // Replace em dash (—) or en dash (–) before numbers/percentages with comma (e.g. "fast—60%" → "fast, 60%")
      .replace(/\s*[—–]\s*(?=\d)/g, ", ")
      .replace(/\*\*(.*?)\*\*/g, '$1')      // Bold
      .replace(/__(.*?)__/g, '$1')          // Bold alt
      .replace(/\*(.*?)\*/g, '$1')          // Italic
      .replace(/_(.*?)_/g, '$1')            // Italic alt
      .replace(/```[\s\S]*?```/g, '')       // Code blocks
      .replace(/`(.*?)`/g, '$1')            // Inline code
      .replace(/^#{1,6}\s+/gm, '')          // Headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/^\s*[\*\-\+]\s+/gm, '')     // List markers
      .replace(/\n{3,}/g, '\n\n')           // Multiple newlines
      // Remove emojis (common emoji ranges)
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '') // Emojis (surrogate pairs)
      .replace(/[\u2600-\u26FF]/g, '')  // Miscellaneous Symbols
      .replace(/[\u2700-\u27BF]/g, '')  // Dingbats
      .replace(/\uD83D[\uDE80-\uDEFF]/g, '') // Transport and Map Symbols
      .replace(/\uD83C[\uDDE0-\uDDFF]/g, '') // Flags
      .replace(/\uD83E[\uDD00-\uDDFF]/g, '') // Supplemental Symbols and Pictographs
      .trim();
  }

  private getCacheKey(prompt: string, options: GenerationOptions): string {
    const mode = options.generationMode ?? "standard";
    return `${options.contentType}:${mode}:${options.tone}:${options.style}:${options.length}:${prompt.slice(0, 100)}`;
  }

  private isRateLimitError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes("rate limit") ||
      error.message.includes("429")
    );
  }

  private isQuotaError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes("quota") ||
      error.message.includes("insufficient_quota")
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let generatorInstance: OptimizedAIGenerator | null = null;

export function getAIGenerator(): OptimizedAIGenerator {
  if (!generatorInstance) {
    generatorInstance = new OptimizedAIGenerator();
  }
  return generatorInstance;
}