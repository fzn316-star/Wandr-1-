import 'server-only';

/**
 * DeepSeek client and the grounding contract (plan §4).
 *
 * The anti-hallucination guarantee is structural, not a prompt instruction: the
 * `present_destinations` tool constrains `destination_id` to an `enum` of real KB
 * row IDs, with `strict: true`. The model physically cannot name a place that
 * isn't in the catalogue. It chooses and explains; the database states facts.
 *
 * Strict mode is only enforced on DeepSeek's /beta endpoint. On the standard
 * endpoint the request still succeeds and the enum is simply not applied — a
 * silent downgrade of the exact property this design exists to provide, which is
 * why the base URL is asserted at startup rather than defaulted.
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com/beta';

export const DISCOVERY_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-pro';

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function deepseekConfig(): DeepSeekConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set. See .env.local.example.');
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL;
  if (!/\/beta\/?$/.test(baseUrl)) {
    throw new Error(
      `DEEPSEEK_BASE_URL must end in /beta — strict tool schemas are only enforced there, ` +
        `and without it the destination_id enum stops being applied silently. Got: ${baseUrl}`
    );
  }

  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ''), model: DISCOVERY_MODEL };
}

// ── Tool definitions ─────────────────────────────────────────────────────────

/**
 * Built once per process from the KB and reused. The enum MUST be the full
 * catalogue and MUST NOT vary per request: tool definitions sit at the front of
 * the prompt prefix, so a per-request enum would invalidate DeepSeek's automatic
 * context cache on every single turn (§4.4).
 */
export function presentDestinationsTool(allDestinationIds: string[]) {
  return {
    type: 'function' as const,
    function: {
      name: 'present_destinations',
      description:
        'Show destination cards to the traveller. Call this once per response, after you ' +
        'have explained your reasoning in text. Only pass IDs from the catalogue in the ' +
        'system prompt.',
      strict: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['selections'],
        properties: {
          selections: {
            type: 'array',
            description:
              'Between 3 and 4 destinations, best match first. Never more than 4 — a longer ' +
              'list is harder to choose from, not more helpful.',
            items: {
              type: 'object',
              additionalProperties: false,
              // Strict mode requires every property to be listed in `required`.
              required: ['destination_id', 'match_rationale', 'curiosity_hook'],
              properties: {
                destination_id: {
                  type: 'string',
                  description: 'Catalogue ID. Must be one of the enumerated values.',
                  enum: allDestinationIds,
                },
                match_rationale: {
                  type: 'string',
                  description:
                    'Why THIS traveller specifically — must reference something they actually ' +
                    'said (NFR-2.4.1). Never generic praise for the destination.',
                },
                curiosity_hook: {
                  type: 'string',
                  description:
                    'One surprising, verifiable detail that makes them want to know more.',
                },
              },
            },
          },
        },
      },
    },
  };
}

/**
 * Structured extraction (§4.5) — replaces the regex heuristics in travelContext.ts.
 * Same guarantee as above: the model can only emit taxonomy values that exist.
 */
export function updateTravelerContextTool(categorySlugs: string[]) {
  return {
    type: 'function' as const,
    function: {
      name: 'update_traveler_context',
      description:
        'Record what you have learned about the traveller from this message. Call this ' +
        'whenever they reveal who they are travelling with, what they want to avoid, or ' +
        'how they like to travel. Omit nothing you are confident about; guess nothing.',
      strict: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['travel_mode', 'negatives', 'comfort_tier', 'adventure_level'],
        properties: {
          travel_mode: {
            type: ['string', 'null'],
            description: 'The six PRD context modes. null when not yet evidenced.',
            enum: ['solo', 'couple', 'friends', 'family_young_kids', 'family_teens', 'digital_nomad', null],
          },
          negatives: {
            type: 'array',
            description: 'Categories the traveller has ruled out. Empty array when none.',
            items: { type: 'string', enum: categorySlugs },
          },
          comfort_tier: {
            type: ['string', 'null'],
            enum: ['backpacker', 'mid_range', 'boutique', 'luxury', null],
          },
          adventure_level: {
            type: ['string', 'null'],
            enum: ['relaxed', 'balanced', 'active', null],
          },
        },
      },
    },
  };
}

// ── Request ──────────────────────────────────────────────────────────────────

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface DeepSeekToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/**
 * Opens a streaming chat completion. Returns the raw Response so the caller owns
 * the SSE parse — `/api/discover` re-emits deltas on its own event contract (§5)
 * rather than proxying DeepSeek's wire format to the browser.
 */
export async function streamChatCompletion(params: {
  messages: ChatMessageParam[];
  tools?: unknown[];
  signal?: AbortSignal;
  maxTokens?: number;
}): Promise<Response> {
  const { apiKey, baseUrl, model } = deepseekConfig();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      tools: params.tools,
      stream: true,
      // V4 emits chain-of-thought into `reasoning_content`, and it is billed
      // against the SAME budget as the answer. A tight cap here does not produce a
      // short reply — it produces NO reply, because thinking consumes the budget
      // before `content` or `tool_calls` are ever emitted. Leave real headroom.
      max_tokens: params.maxTokens ?? 8000,
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 400)}`);
  }

  return res;
}
