/**
 * AI feature schemas — for the 7-layer pipeline at POST /ai/query.
 *
 * The backend can return one of several shapes depending on which layer
 * resolved the query:
 *   Layer 1 — { source: 'layer1_intent', intent, response: null, needsDirectAction: true }
 *   Layer 2 — { source: 'layer2_exact', ...cached_response }
 *   Layer 3 — { source: 'layer3_semantic', similarity, ...cached_response }
 *   Layer 5 — { intent, response, confidence, actions, model, tier, tokensInput, tokensOutput }
 *   Error  — { intent: 'error', response: 'Maaf...', confidence: 0, ... }
 *
 * We use a permissive Zod schema with `.passthrough()` since the LLM
 * may return arbitrary extra fields in the actions array.
 *
 * The mobile chat screen routes on `intent` to render the right card.
 */

import { z } from 'zod';

// ─── Known intents that map to a generative card ──────
export const knownIntents = [
  'record_sale',
  'record_expense',
  'give_credit',
  'daily_pnl',
  'health_score',
  'check_stock',
  'show_menu',
  'scheme_match',
  'loan_match',
  'general',
  'error',
] as const;
export type KnownIntent = (typeof knownIntents)[number];

// ─── Action item (LLM-generated, permissive shape) ────
export const aiActionSchema = z
  .object({
    type: z.string().optional(),
    label: z.string().optional(),
    url: z.string().optional(),
    amount: z.coerce.number().optional(),
    sheet: z.string().optional(),
  })
  .passthrough();
export type AiAction = z.infer<typeof aiActionSchema>;

// ─── Unified AI query response ────────────────────────
export const aiQueryResponseSchema = z
  .object({
    source: z.string().optional(),
    intent: z.string().default('general'),
    response: z.string().nullable().optional(),
    confidence: z.coerce.number().optional(),
    actions: z.array(aiActionSchema).optional().default([]),
    needsDirectAction: z.boolean().optional(),
    similarity: z.coerce.number().optional(),
    model: z.string().optional(),
    tier: z.coerce.number().optional(),
    tokensInput: z.coerce.number().optional(),
    tokensOutput: z.coerce.number().optional(),
    cacheHit: z.string().nullable().optional(),
  })
  .passthrough()
  .transform((row) => ({
    source: row.source ?? null,
    intent: row.intent || 'general',
    response: row.response ?? null,
    confidence: row.confidence ?? 0.5,
    actions: row.actions ?? [],
    needsDirectAction: row.needsDirectAction ?? false,
    similarity: row.similarity ?? null,
    model: row.model ?? null,
    tier: row.tier ?? null,
    tokensInput: row.tokensInput ?? 0,
    tokensOutput: row.tokensOutput ?? 0,
  }));

export type AiQueryResponse = z.infer<typeof aiQueryResponseSchema>;
