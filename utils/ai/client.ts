/**
 * Shared LLM client — DeepSeek first (OpenAI-compatible API).
 * Docs: https://api-docs.deepseek.com/
 *
 * Models (2026):
 * - deepseek-v4-flash  → default for captions, ideas, high volume
 * - deepseek-v4-pro    → premium / strategy / long-form
 *
 * Legacy IDs deepseek-chat / deepseek-reasoner retire 2026-07-24 — do not use.
 */

import OpenAI from "openai";

export const DEEPSEEK_MODELS = {
  /** Fast + cheap — best for tweets, IG captions, content ideas */
  flash: "deepseek-v4-flash",
  /** Higher quality — brand strategy, audience research, long LinkedIn */
  pro: "deepseek-v4-pro",
} as const;

export type DeepSeekModelId =
  (typeof DEEPSEEK_MODELS)[keyof typeof DEEPSEEK_MODELS];

/** Approximate USD per 1M tokens (order-of-magnitude for logging only). */
export const DEEPSEEK_TOKEN_COSTS: Record<
  string,
  { input: number; output: number }
> = {
  "deepseek-v4-flash": { input: 0.14, output: 0.28 },
  "deepseek-v4-pro": { input: 1.0, output: 2.0 },
};

let clientInstance: OpenAI | null = null;

export function getAIProvider(): "deepseek" | "openai" {
  if (process.env.DEEPSEEK_API_KEY?.trim()) return "deepseek";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  throw new Error(
    "No AI key configured. Set DEEPSEEK_API_KEY in .env (recommended)."
  );
}

/**
 * OpenAI SDK pointed at DeepSeek (or OpenAI as fallback).
 */
export function getChatClient(): OpenAI {
  if (clientInstance) return clientInstance;

  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    clientInstance = new OpenAI({
      apiKey: deepseekKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
    return clientInstance;
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    clientInstance = new OpenAI({ apiKey: openaiKey });
    return clientInstance;
  }

  throw new Error(
    "DEEPSEEK_API_KEY is not configured. Get a key at https://platform.deepseek.com"
  );
}

/** Resolve settings / UI model id → actual API model string. */
export function resolveModelId(
  requested?: string | null,
  opts?: { premium?: boolean }
): string {
  const provider = (() => {
    try {
      return getAIProvider();
    } catch {
      return "deepseek";
    }
  })();

  if (provider === "deepseek") {
    if (
      requested === DEEPSEEK_MODELS.pro ||
      requested === "deepseek-v4-pro" ||
      requested === "deepseek-reasoner"
    ) {
      return DEEPSEEK_MODELS.pro;
    }
    if (
      requested === DEEPSEEK_MODELS.flash ||
      requested === "deepseek-v4-flash" ||
      requested === "deepseek-chat"
    ) {
      return DEEPSEEK_MODELS.flash;
    }
    // Map old OpenAI picks from settings UI → DeepSeek
    if (
      requested === "gpt-4" ||
      requested === "gpt-4o" ||
      requested === "claude-3-sonnet"
    ) {
      return DEEPSEEK_MODELS.pro;
    }
    if (opts?.premium) return DEEPSEEK_MODELS.pro;
    return DEEPSEEK_MODELS.flash;
  }

  // OpenAI fallback path
  if (opts?.premium || requested === "gpt-4" || requested === "gpt-4o") {
    return "gpt-4o";
  }
  return requested || "gpt-4o-mini";
}

export function resetChatClientForTests() {
  clientInstance = null;
}
