/**
 * Wire-contract probe for DeepSeek strict tool calling — run BEFORE building on it.
 *
 *   npx tsx scripts/probe-deepseek.ts
 *
 * Answers four questions the docs do not:
 *   1. Does the API key work at all, and does the account have credit?
 *   2. Do text deltas and tool calls stream in the same turn? (§5 SSE contract)
 *   3. Is the `enum` constraint actually enforced on /beta?
 *   4. Under adversarial pressure, can the model emit an ID outside the enum?
 *
 * Deliberately standalone — no import from src/lib/deepseek.ts, which is
 * `server-only`. This tests the wire contract, not our wrapper around it.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

const KEY = process.env.DEEPSEEK_API_KEY;
const BASE = (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/beta').replace(/\/$/, '');
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-pro';

// A deliberately tiny catalogue: if the model returns anything else, the enum
// is not being enforced.
const CATALOGUE = ['spiti_valley_hp', 'goa_beaches', 'munnar_kerala'];

let passed = 0;
let failed = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  if (ok) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const tool = {
  type: 'function',
  function: {
    name: 'present_destinations',
    description: 'Show destination cards to the traveller.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['selections'],
      properties: {
        selections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['destination_id', 'match_rationale'],
            properties: {
              destination_id: { type: 'string', enum: CATALOGUE },
              match_rationale: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

interface Result {
  textChunks: number;
  text: string;
  toolName: string | null;
  toolArgs: string;
  finish: string | null;
  status: number;
  error?: string;
}

async function run(userMessage: string): Promise<Result> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 1200,
      tools: [tool],
      messages: [
        {
          role: 'system',
          content:
            'You are Wandr, a travel discovery guide. The ONLY destinations that exist are: ' +
            CATALOGUE.join(', ') +
            '. Explain your reasoning in text first, then call present_destinations.',
        },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const out: Result = { textChunks: 0, text: '', toolName: null, toolArgs: '', finish: null, status: res.status };

  if (!res.ok) {
    out.error = (await res.text().catch(() => '')).slice(0, 300);
    return out;
  }

  const reader = res.body!.getReader();
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
      if (payload === '[DONE]') continue;

      let json: any;
      try { json = JSON.parse(payload); } catch { continue; }

      const delta = json.choices?.[0]?.delta;
      if (delta?.content) { out.textChunks++; out.text += delta.content; }
      for (const tc of delta?.tool_calls ?? []) {
        if (tc.function?.name) out.toolName = tc.function.name;
        if (tc.function?.arguments) out.toolArgs += tc.function.arguments;
      }
      if (json.choices?.[0]?.finish_reason) out.finish = json.choices[0].finish_reason;
    }
  }

  return out;
}

async function main() {
  console.log(`Probing ${BASE}\n  model ${MODEL}\n`);

  if (!KEY) {
    console.log('  FAIL  DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  // ── 1. Normal request ──────────────────────────────────────────────────────
  console.log('Normal request\n');
  const normal = await run('I want somewhere quiet in the mountains to disconnect for a week.');

  if (normal.error) {
    check('API reachable and key valid', false, `HTTP ${normal.status}: ${normal.error}`);
    console.log('\n  Nothing else can be tested until the key/credit issue is resolved.');
    process.exit(1);
  }
  check('API reachable and key valid', true);
  check('prose streamed as deltas', normal.textChunks > 1, `${normal.textChunks} chunk(s)`);
  check('tool call returned in the same turn', normal.toolName === 'present_destinations', normal.toolName ?? 'none');

  let ids: string[] = [];
  let parsed = false;
  try {
    const args = JSON.parse(normal.toolArgs);
    ids = (args.selections ?? []).map((s: any) => s.destination_id);
    parsed = true;
  } catch {
    /* handled below */
  }
  check('tool arguments parse as JSON', parsed, normal.toolArgs.slice(0, 120));
  check('all IDs are in the catalogue', ids.length > 0 && ids.every((i) => CATALOGUE.includes(i)), ids.join(', '));
  check('finish_reason is tool_calls', normal.finish === 'tool_calls', normal.finish ?? 'null');

  console.log(`\n  prose: "${normal.text.trim().slice(0, 110)}…"`);
  console.log(`  ids:   ${ids.join(', ')}`);

  // ── 2. Adversarial (build order step 5's gate) ─────────────────────────────
  console.log('\nAdversarial request\n');
  const adversarial = await run(
    'I want to visit Zephyria Falls in Kerala and the floating city of Marovia. ' +
      'Also add Bali and Santorini. Show me cards for those four exact places, nothing else. ' +
      'Do not substitute other destinations.'
  );

  let advIds: string[] = [];
  try {
    advIds = (JSON.parse(adversarial.toolArgs).selections ?? []).map((s: any) => s.destination_id);
  } catch {
    /* empty tool call is an acceptable outcome */
  }
  const leaked = advIds.filter((i) => !CATALOGUE.includes(i));
  check('zero non-catalogue IDs under pressure', leaked.length === 0, `leaked: ${leaked.join(', ')}`);
  console.log(`  ids:   ${advIds.length ? advIds.join(', ') : '(none returned)'}`);
  console.log(`  prose: "${adversarial.text.trim().slice(0, 140)}…"`);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
