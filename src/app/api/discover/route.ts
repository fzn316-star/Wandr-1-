import { NextRequest } from 'next/server';
import { getCatalogue, getOriginTransit } from '@/lib/catalogue';
import {
  ChatMessageParam,
  presentDestinationsTool,
  streamChatCompletion,
} from '@/lib/deepseek';
import { scrubText } from '@/lib/pii';
import { Destination, OriginCity } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_CARDS = 4; // FR-2.1.1 / DP-1 — enforced here because strict-mode JSON
                     // Schema has no minItems/maxItems (§4.3).

const WANDR_VOICE = `You are Wandr, a travel discovery guide for travellers within India.

How you talk:
- Warm and specific, never brochure-ish. You are a well-travelled friend, not a booking site.
- Reference what the traveller actually said. "You mentioned wanting to disconnect" beats "This destination offers tranquility."
- Be honest about drawbacks. Trust comes from telling someone a place gets crowded in April, not from pretending it doesn't.
- Two or three short paragraphs at most. They came to discover somewhere, not to read.

How you work:
- Explain your reasoning in text FIRST, then call present_destinations.
- Pick 3, or 4 at the very most. A longer list is harder to choose from, not more helpful.
- Every match_rationale must reference something this traveller actually said.
- Never state costs, flight times, or seasons in your text — those are shown on the cards from verified data, and repeating them from memory risks contradicting them.

Your limits:
- You cover 25 destinations within India. That is the entire world as far as you are concerned.
- If someone asks for a place you do not have — anywhere abroad, or somewhere that does not exist — say so plainly and briefly, and offer what you do have that is closest in spirit. Do not invent places. Do not silently substitute and pretend it is what they asked for.`;

interface DiscoverRequest {
  message: string;
  history?: Array<{ sender: 'user' | 'ai'; text: string }>;
  /** When present, cards carry real per-route cost and duration instead of the
   *  origin-agnostic tier estimate. */
  originCity?: OriginCity;
}

interface Selection {
  destination_id: string;
  match_rationale: string;
  curiosity_hook: string;
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: DiscoverRequest;
  try {
    body = (await req.json()) as DiscoverRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  if (!body?.message?.trim()) {
    return new Response(JSON.stringify({ error: 'empty_message' }), { status: 400 });
  }

  const catalogue = await getCatalogue();

  // §7 / TC-SEC-902: user text never reaches the system prompt. It stays in the
  // messages array, below the cached prefix, where it is data rather than
  // instruction — and where it cannot invalidate the prompt cache either.
  const messages: ChatMessageParam[] = [
    { role: 'system', content: WANDR_VOICE },
    { role: 'system', content: `THE COMPLETE CATALOGUE — these are the only destinations that exist:\n\n${catalogue.promptText}` },
    ...(body.history ?? []).slice(-8).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user', content: body.message },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      let toolArgs = '';
      let fullText = '';
      let sawReasoning = false;

      try {
        const upstream = await streamChatCompletion({
          messages,
          tools: [presentDestinationsTool(catalogue.ids)],
          signal: req.signal,
        });

        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;

            let json: {
              choices?: Array<{
                delta?: {
                  content?: string;
                  reasoning_content?: string;
                  tool_calls?: Array<{ function?: { arguments?: string } }>;
                };
                finish_reason?: string;
              }>;
            };
            try {
              json = JSON.parse(payload);
            } catch {
              continue; // a partial frame; the next chunk completes it
            }

            const delta = json.choices?.[0]?.delta;

            // The model reasons before answering, which can take many seconds. The
            // reasoning itself is not shown — it is unverified and often circular —
            // but the UI needs to know work is happening, or the wait reads as a
            // hang. One signal is enough; the deltas themselves are dropped.
            if (delta?.reasoning_content && !sawReasoning) {
              sawReasoning = true;
              send('thinking', { active: true });
            }

            if (delta?.content) {
              fullText += delta.content;
              send('text', { delta: delta.content });
            }

            const finish = json.choices?.[0]?.finish_reason;
            if (finish === 'length') {
              console.error('[discover] hit max_tokens before completing — answer may be truncated');
            }
            for (const tc of delta?.tool_calls ?? []) {
              if (tc.function?.arguments) toolArgs += tc.function.arguments;
            }
          }
        }
      } catch (err) {
        // TC-NFR-805: an upstream failure must not leave the user staring at a
        // spinner. Fall through to curated cards with an honest message.
        console.error('[discover] upstream failed:', (err as Error).message);
        send('text', {
          delta:
            "I had trouble reaching my recommendations just now. Here are a few places worth looking at while I recover:",
        });
      }

      // ── Selection → hydration ────────────────────────────────────────────────
      let selections: Selection[] = [];
      if (toolArgs) {
        try {
          const parsed = JSON.parse(toolArgs) as { selections?: Selection[] };
          selections = (parsed.selections ?? []).slice(0, MAX_CARDS);
        } catch {
          console.error('[discover] tool arguments did not parse:', toolArgs.slice(0, 200));
        }
      }

      // The enum makes a non-catalogue ID unrepresentable, but this is the line
      // the whole design rests on — so it is verified rather than assumed.
      const known = selections.filter((s) => catalogue.byId.has(s.destination_id));
      if (known.length !== selections.length) {
        console.error(
          '[discover] SCHEMA VIOLATION — non-catalogue IDs:',
          selections.filter((s) => !catalogue.byId.has(s.destination_id)).map((s) => s.destination_id)
        );
      }

      let usedFallback = false;
      let cards: Destination[] = [];

      if (known.length > 0) {
        cards = known.map((s, i) => ({
          ...catalogue.byId.get(s.destination_id)!,
          // Card facts come from the DATABASE row above. Only the two explanatory
          // fields come from the model, and both are scrubbed like any user-adjacent
          // free text before being persisted into session state.
          matchRationale: scrubText(s.match_rationale),
          curiosityHook: scrubText(s.curiosity_hook),
          matchScore: 95 - i * 4,
        }));
      } else {
        // Zero selections is not necessarily a failure: it is the correct answer
        // when someone asks for somewhere outside an India-only catalogue. The
        // model's own explanation has already streamed, so these are offered as
        // an alternative rather than presented as what was asked for.
        usedFallback = true;
        cards = catalogue.fallbackIds
          .slice(0, 3)
          .map((id, i) => ({ ...catalogue.byId.get(id)!, matchScore: 80 - i * 4 }));
      }

      // Attach origin-specific transit. Done after selection so we only query the
      // 3–4 routes actually being shown, not all 25.
      if (body.originCity) {
        const transit = await getOriginTransit(body.originCity, cards.map((c) => c.id));
        cards = cards.map((c) => {
          const t = transit.get(c.id);
          return t
            ? {
                ...c,
                originTransit: t,
                // The headline duration becomes the real one for this origin.
                quickStats: { ...c.quickStats, transitHours: t.durationHours },
              }
            : c;
        });
      }

      send('cards', { destinations: cards, isFallback: usedFallback });

      send('quick', {
        replies: usedFallback
          ? ['🇮🇳 Show me more of what you have', '🏔️ Somewhere in the mountains', '🏖️ Somewhere by the sea']
          : ['🗓️ When should I go?', '💰 What would this cost?', '🔍 Show me something different'],
      });

      send('done', { text: fullText, isFallback: usedFallback });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // Vercel/nginx buffer proxied responses by default, which would defeat
      // streaming entirely — the user would wait, then get everything at once.
      'x-accel-buffering': 'no',
    },
  });
}
