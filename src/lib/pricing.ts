import type { LanguageModelUsage } from "ai";

/**
 * USD per 1M tokens, standard tier.
 * Verified 2026-08-27 against https://developers.openai.com/api/docs/pricing
 */
const PRICING = {
  "gpt-5.4": { input: 2.5, cachedInput: 0.25, output: 15.0 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cachedInput: 0.02, output: 1.25 },
} as const;

const PER_MILLION = 1_000_000;

export type PricedModel = keyof typeof PRICING;

export const isPricedModel = (model: string): model is PricedModel =>
  model in PRICING;

export type CostBreakdown = {
  /** Input tokens billed at the full rate (total input minus cache reads). */
  uncachedInputTokens: number;
  /** Input tokens served from cache, billed at the discounted rate. */
  cachedInputTokens: number;
  /** Reasoning tokens. A subset of output tokens, not an addition to them. */
  reasoningTokens: number;
  /** Visible output tokens. The rest of the output total. */
  textOutputTokens: number;
  uncachedInputCost: number;
  cachedInputCost: number;
  outputCost: number;
  totalCost: number;
};

/**
 * Returns null for models with no price on file, so an unknown model shows
 * token counts without a fabricated cost.
 */
export function calculateCost(
  model: string,
  usage: LanguageModelUsage,
): CostBreakdown | null {
  if (!isPricedModel(model)) return null;
  const rates = PRICING[model];

  const inputTokens = usage.inputTokens ?? 0;
  const cachedInputTokens = usage.inputTokenDetails.cacheReadTokens ?? 0;
  // `inputTokens` already includes cache reads, so the full-rate portion is
  // the remainder. Cache *writes* are not billed separately by OpenAI.
  const uncachedInputTokens =
    usage.inputTokenDetails.noCacheTokens ??
    Math.max(0, inputTokens - cachedInputTokens);

  const outputTokens = usage.outputTokens ?? 0;
  const reasoningTokens = usage.outputTokenDetails.reasoningTokens ?? 0;
  // Reasoning tokens are billed at the output rate and are already counted in
  // `outputTokens` — charging them again would double-bill.
  const textOutputTokens =
    usage.outputTokenDetails.textTokens ??
    Math.max(0, outputTokens - reasoningTokens);

  const uncachedInputCost = (uncachedInputTokens * rates.input) / PER_MILLION;
  const cachedInputCost = (cachedInputTokens * rates.cachedInput) / PER_MILLION;
  const outputCost = (outputTokens * rates.output) / PER_MILLION;

  return {
    uncachedInputTokens,
    cachedInputTokens,
    reasoningTokens,
    textOutputTokens,
    uncachedInputCost,
    cachedInputCost,
    outputCost,
    totalCost: uncachedInputCost + cachedInputCost + outputCost,
  };
}
