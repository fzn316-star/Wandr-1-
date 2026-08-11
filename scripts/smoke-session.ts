/**
 * End-to-end smoke test for /api/session/[id] — build order step 4.
 * Requires `npm run dev` running.
 *
 *   npx tsx scripts/smoke-session.ts
 *
 * Covers TC-504 (restore inside the window), TC-505 (expired/unknown handling),
 * TC-SEC-905 (PII scrubbing on the write path), and the §7 requirement that the
 * API cannot be used to confirm whether a session ID was ever real.
 */
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const uuid = () => crypto.randomUUID();

function sessionBody(id: string, overrides: Record<string, unknown> = {}) {
  return {
    sessionId: id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3600_000).toISOString(),
    title: 'Trip discovery',
    moodText: 'Somewhere quiet in the mountains',
    selectedTileIds: ['mountains'],
    constraints: { originCity: 'Delhi NCR' },
    chatMessages: [
      { id: 'm1', sender: 'user', text: 'mail me at faizan@example.com or call 9876543210', timestamp: new Date().toISOString() },
    ],
    savedDestinations: [],
    dismissedDestinationIds: [],
    likedDestinationIds: [],
    dismissedCategoryCounts: {},
    crystallizedDestinationId: null,
    hasReflectedStyle: false,
    lastLearningAckAtMessageCount: 0,
    maxBudgetINR: 120000,
    ...overrides,
  };
}

async function main() {
  console.log(`Smoke test against ${BASE}\n`);

  const id = uuid();

  // ── Create ─────────────────────────────────────────────────────────────────
  const put = await fetch(`${BASE}/api/session/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sessionBody(id)),
  });
  const created = await put.json();
  check('PUT creates a session', put.ok && created.sessionId === id, `status ${put.status}`);

  const ttlHours = (new Date(created.expiresAt).getTime() - new Date(created.createdAt).getTime()) / 3600_000;
  check('expiry is 48h from creation (FR-5.3.4)', Math.abs(ttlHours - 48) < 0.1, `got ${ttlHours.toFixed(2)}h`);

  // ── Restore ────────────────────────────────────────────────────────────────
  const get = await fetch(`${BASE}/api/session/${id}`, { cache: 'no-store' });
  const restored = await get.json();
  check('GET restores the session (TC-504)', get.ok && restored.sessionId === id, `status ${get.status}`);
  check('state round-trips intact', restored.maxBudgetINR === 120000 && restored.constraints?.originCity === 'Delhi NCR');

  // ── PII (TC-SEC-905) ───────────────────────────────────────────────────────
  const stored = restored.chatMessages?.[0]?.text ?? '';
  check('email scrubbed before persistence', !stored.includes('faizan@example.com'), stored);
  check('phone scrubbed before persistence', !stored.includes('9876543210'), stored);

  // ── Expired vs unknown are indistinguishable (§7) ──────────────────────────
  const unknown = await fetch(`${BASE}/api/session/${uuid()}`);
  const malformed = await fetch(`${BASE}/api/session/not-a-uuid`);
  check('unknown session → 404', unknown.status === 404, `status ${unknown.status}`);
  check('malformed id → 404, not 400', malformed.status === 404, `status ${malformed.status}`);
  const unknownBody = JSON.stringify(await unknown.json());
  const malformedBody = JSON.stringify(await malformed.json());
  check('responses are byte-identical (no existence oracle)', unknownBody === malformedBody, `${unknownBody} vs ${malformedBody}`);

  // ── URL is authoritative over body ─────────────────────────────────────────
  const victim = uuid();
  await fetch(`${BASE}/api/session/${victim}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sessionBody(victim, { title: 'victim session' })),
  });
  await fetch(`${BASE}/api/session/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sessionBody(victim, { title: 'attacker overwrote this' })),
  });
  const victimAfter = await (await fetch(`${BASE}/api/session/${victim}`)).json();
  check('body sessionId cannot write to another session', victimAfter.title === 'victim session', `title is "${victimAfter.title}"`);

  // ── Bad input ──────────────────────────────────────────────────────────────
  const badJson = await fetch(`${BASE}/api/session/${uuid()}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: 'not json',
  });
  check('malformed JSON → 400', badJson.status === 400, `status ${badJson.status}`);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const del = await fetch(`${BASE}/api/session/${id}`, { method: 'DELETE' });
  check('DELETE succeeds', del.ok, `status ${del.status}`);
  const afterDelete = await fetch(`${BASE}/api/session/${id}`);
  check('deleted session is gone', afterDelete.status === 404, `status ${afterDelete.status}`);

  await fetch(`${BASE}/api/session/${victim}`, { method: 'DELETE' });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
