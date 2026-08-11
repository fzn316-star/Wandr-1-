# Wandr V1 — Phase 2 Backend Plan

> **Status:** Draft for review
> **Date:** August 9, 2026
> **Supersedes:** the Phase 2 table in [implementation_plan_wandr_v1.md](file:///d:/Product%20Space/AI%20Sprint%201/docs/implementation_plan_wandr_v1.md)
> **Prerequisite:** Phase 1 frontend complete (F1–F6 approved)

---

## 0. Decisions locked before planning

| # | Decision | Rationale |
|---|---|---|
| 1 | **India-only knowledge base**, Indian origin cities | The only version where "grounded in verified data" is true rather than aspirational. Global cost data has no free authoritative source, and fabricated cost figures attack the exact trust claim the product is built on (PRD §2.3, DP-4). |
| 2 | **ID-constrained selection** — the LLM selects IDs, never names places | Anti-hallucination becomes a schema guarantee instead of a prompt instruction (FR-2.1.6, NFR-2.1.4). |
| 3 | **Full-catalog prompt, no RAG**; SSE streaming | 25 destinations ≈ 5K tokens. Retrieval error is a failure mode you avoid entirely by not retrieving. |
| 4 | **Saved destinations are session-scoped** | Per-browser saves are an auth-less persistent account (deferred to V2 per §6.1) and break session sharing. |

### PRD amendments these require

- **§4.1 (LOCKED — "All travelers")** → V1 audience narrows to travellers within India. Personas are currently Western-flavoured (NYC/London origins) and need reworking.
- **§6.3 Layer 1** → the curated KB is explicitly Indian domestic.
- **Epic 7 / NFR-7.1.1** → the 5-region global transit matrix is replaced by origin-city × destination routes with transport mode. This is an *upgrade* in fidelity: Indian rail and air fares are knowable in a way global cost-of-living is not.

### Frontend transit rework — ✅ done (Aug 9, 2026)

All 25 records previously carried `destinationRegionBucket: 'Asia-Pacific'` with `flightTimeHours: 16–20`. Those were written from a **North American origin** — the cost engine was pricing trips *into* India rather than *within* it. Corrected ahead of seeding, so the schema below mirrors shipped types rather than a proposal:

| Was | Now |
|---|---|
| `RegionBucket` — 5 world regions | `OriginCity` — 8 Indian metros (Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad) |
| `destinationRegionBucket` | `travelZone` — 7 zones grouped by how transit cost behaves, not by administrative geography |
| `flightTimeHours: 16–20` | `transitHours` — door-to-door, min 1.5h / median 3h / max 12h |
| — | `primaryMode` + `nearestAccess` — 13 of 25 need a road transfer, 2 are rail-first, 1 is road-only. "Flight time" cannot describe a destination with no airport. |
| Transit estimates $250–750 (intercontinental) | $60–280 (Indian domestic) |

Two consequences the scope forced: the three non-India destinations (Azores, Puglia, Luang Prabang) were removed from the mock KB, and the deep-dive's visa notice — which told domestic travellers to contact India's embassy — became Inner Line Permit guidance for Ladakh, Sikkim, the Andamans, and the Northeast.

Validated by a plausibility check, not just a typecheck: no domestic leg over 12h, no `flight` mode over 3h, no `road` mode under 5h. 25/25 pass.

---

## 1. Stack

| Layer | Choice | Note |
|---|---|---|
| Database | Supabase Postgres | Row-level security, `pgcrypto` for UUIDs |
| API | **Next.js Route Handlers on Vercel** | Changed from the original plan's Supabase Edge Functions — the app is already Next.js on Vercel, and Route Handlers stream SSE natively. One runtime instead of two. |
| LLM | `claude-opus-5` via `@anthropic-ai/sdk` | 1M context, 128K output, adaptive thinking on by default |
| Images | Unsplash API (already in use) | Licensed, attributed |

---

## 2. Schema

```sql
create extension if not exists pgcrypto;

-- ── Layer 1 Knowledge Base ────────────────────────────────────────────────
create table destinations (
  id                 text primary key,          -- stable slug, e.g. 'spiti_valley'
  name               text not null,
  state              text not null,             -- Indian state (replaces `country`)
  region             text not null,             -- display string, e.g. 'Himalayan North'
  tagline            text not null,
  hero_image_url     text not null,
  gallery_urls       text[] not null,
  vibe_tags          text[] not null,
  categories         text[] not null,           -- taxonomy for negative filtering (FR-3.3.2)
  travel_zone        text not null,             -- mirrors the shipped TravelZone union
  best_months        text[] not null,
  avg_daily_cost_inr integer not null,
  ground_cost_tier   text not null check (ground_cost_tier in ('₹','₹₹','₹₹₹','₹₹₹₹')),
  transit_cost_tier  text not null check (transit_cost_tier in ('₹','₹₹','₹₹₹','₹₹₹₹')),
  transit_hours      numeric(4,1) not null,     -- door-to-door from a major metro
  primary_mode       text not null check (primary_mode in ('flight','flight_plus_road','rail','road')),
  nearest_access     text not null,             -- airport or railhead that explains transit_hours
  overview_summary   text not null,
  best_for_tags      text[] not null,
  why_love_it        text[] not null,
  what_to_know       text[] not null,
  hidden_fees        jsonb not null default '[]',
  last_verified_date date not null,
  is_uncertain       boolean not null default false,
  uncertainty_notes  text,

  -- FR-6.2.5 enforced in the database, not left to the LLM to remember
  constraint what_to_know_min_two check (array_length(what_to_know, 1) >= 2)
);

-- ── Origin-aware transit (replaces the global RegionBucket matrix) ────────
create table origin_cities (
  id    text primary key,        -- 'delhi_ncr', 'mumbai', 'bengaluru', …
  label text not null
);

create table transit_routes (
  origin_city_id     text not null references origin_cities(id),
  destination_id     text not null references destinations(id) on delete cascade,
  mode               text not null check (mode in ('flight','train','bus','self_drive')),
  typical_cost_inr   integer not null,
  duration_hours     numeric(4,1) not null,
  notes              text,
  last_verified_date date not null,
  primary key (origin_city_id, destination_id, mode)
);

-- ── 48-hour sessions (FR-5.3.x) ──────────────────────────────────────────
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '48 hours',
  state       jsonb not null,        -- mirrors the PersistedSession TS type
  share_token text unique
);

create index sessions_expires_at_idx on sessions (expires_at);

-- ── Reaction signals, split out for analytics (Epic 5) ────────────────────
create table session_reactions (
  id             bigserial primary key,
  session_id     uuid not null references sessions(id) on delete cascade,
  destination_id text not null references destinations(id),
  reaction       text not null check (reaction in ('liked','saved','dismissed')),
  reason_chip    text,
  created_at     timestamptz not null default now()
);
```

**Sizing:** 8 origin cities × 25 destinations × ~2 modes ≈ 400 `transit_routes` rows. Hand-curatable in a sitting or two. The same table at global scope would need cost-of-living data that doesn't exist for free — this is the concrete reason India-only makes the cost engine work rather than compromising it.

**Growth headroom:** nothing here assumes 25. Adding destinations later is an insert plus the matching `transit_routes` rows; the only two things to re-check on expansion are the catalogue's token cost against the cached prefix (§4.4) and the no-RAG decision (§10), and both have roughly an order of magnitude of slack.

**Session TTL:** a `pg_cron` job deletes rows past `expires_at` hourly. Reads also filter on `expires_at > now()`, so expiry is correct even if the job lags.

---

## 3. Where the data comes from

| Field group | Source | Confidence |
|---|---|---|
| Names, coordinates, state/district | Wikidata (CC0) | High |
| Descriptions, "getting there", cautions | Wikivoyage India (CC BY-SA — attribution required) | High |
| Train fares and durations | IRCTC fare classes (public, structured) | High |
| Flight costs and durations | Computed from airport pairs + seeded fare bands | Medium |
| **Daily ground cost, hidden fees** | **Editorial curation, manually verified** | **Owner-verified** |
| Images | Unsplash API | High |

The bottom row is the honest one. There is no API for "what a day in Spiti actually costs." At 25 destinations that is a tractable editorial task; at 50 global destinations it is not, which is what decision 1 turns on. Every row carries `last_verified_date`, and the frontend already renders a stale-data banner past 180 days.

---

## 4. The grounding contract (most important section)

### 4.1 The problem this solves

FR-2.1.6 forbids hallucinated destinations. NFR-2.4.2 forbids fabricated citations. Prompt instructions ("only suggest real places") are not enforcement — they fail silently and unpredictably. The architecture makes the failure *unrepresentable*.

### 4.2 How

The model produces two things per turn: **streaming prose** (the conversational reply) and a **tool call** carrying destination IDs. The tool's schema constrains IDs to an `enum` of real KB rows, with `strict: true`.

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Built once at boot from the KB and cached. STABLE across requests —
// tool definitions sit at the front of the prompt prefix, so a per-request
// enum would invalidate the prompt cache on every single turn.
const ALL_DESTINATION_IDS = await loadAllDestinationIds();

const presentDestinations = {
  name: "present_destinations",
  description:
    "Show destination cards to the traveller. Call this once per response, " +
    "after you have explained your reasoning in text. Only pass IDs from the " +
    "catalogue in the system prompt.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["selections"],
    properties: {
      selections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["destination_id", "match_rationale", "curiosity_hook"],
          properties: {
            destination_id: { type: "string", enum: ALL_DESTINATION_IDS },
            match_rationale: {
              type: "string",
              description:
                "Why THIS traveller specifically — must reference something " +
                "they actually said (NFR-2.4.1).",
            },
            curiosity_hook: { type: "string" },
          },
        },
      },
    },
  },
} as const;
```

The model cannot emit an ID outside `ALL_DESTINATION_IDS`. Card facts (cost, season, transit) are never taken from model output at all — the server joins the returned IDs against Postgres and sends the *database's* numbers to the client. The model chooses and explains; the database states facts.

### 4.3 What the schema cannot enforce

Structured outputs support `enum`, `const`, `anyOf`, and string formats, but **not** array constraints (`minItems`/`maxItems`). So DP-1's "3–4 cards, never 5+" (FR-2.1.1) is enforced server-side:

```ts
const selections = toolCall.input.selections.slice(0, 4);
if (selections.length === 0) { /* fall back to curated static cards — TC-NFR-805 */ }
```

Same for FR-2.2.3 (max 2 consecutive follow-ups) — tracked in session state, not schema.

### 4.4 Request shape

```ts
const stream = client.messages.stream({
  model: "claude-opus-5",
  max_tokens: 8000,
  thinking: { type: "adaptive" },          // on by default on Opus 5; explicit for clarity
  output_config: { effort: "medium" },     // tune against TTFT < 5s (TC-NFR-801)
  system: [
    { type: "text", text: WANDR_VOICE_AND_RULES },
    {
      type: "text",
      text: catalogueAsText,               // all 25 destinations, ~5K tokens
      cache_control: { type: "ephemeral", ttl: "1h" },
    },
  ],
  tools: [presentDestinations],
  messages: conversationHistory,
});
```

**Caching economics.** The catalogue + system prompt is a stable prefix well above Opus 5's 512-token minimum. A 1h TTL costs 2× on write and ~0.1× on read, so it pays back from the third request onward — trivially met by a multi-turn discovery session. Two rules protect it:

1. **Never interpolate anything volatile into the system prompt** — no timestamps, no session ID, no user name. Volatile context goes into `messages`, after the cached prefix.
2. **Never vary the tool definition per request.** This is why §4.2's enum is the full catalogue.

Verify with `usage.cache_read_input_tokens` — if it's zero across a conversation, something is invalidating the prefix.

### 4.5 Structured extraction (F3's regex heuristics, replaced)

[travelContext.ts](src/lib/travelContext.ts) currently infers traveller mode, negatives, and style with regexes — deliberately labelled a mock-scoped stand-in. Backend replaces it with a second `strict: true` tool, `update_traveler_context`, with `travel_mode` as an enum over the six PRD modes and negatives as enum'd category slugs. Same guarantee: the model can only emit taxonomy values that exist.

The frontend's derived-category logic ([`deriveDestinationCategories`](src/lib/travelContext.ts)) moves server-side and reads the `destinations.categories` column instead of pattern-matching vibe tags.

---

## 5. API surface

Each endpoint replaces a specific store action, so the swap is mechanical.

| Route | Method | Replaces | Notes |
|---|---|---|---|
| `/api/session` | POST | `ensureSessionId` | Returns UUID + `expires_at` |
| `/api/session/[id]` | GET | `hydrateSession` | 404 when expired or unknown — the response must not distinguish the two (§7) |
| `/api/discover` | POST (SSE) | `submitMoodPrompt`, `sendChatMessage`, `askWhyDestination` | Streams `text` deltas, then a `cards` event with hydrated destinations |
| `/api/session/[id]/reaction` | POST | `saveDestination`, `dismissDestination`, `toggleLikeDestination` | Writes `session_reactions`; returns updated blocked categories |
| `/api/session/[id]/share` | POST | Deep-dive share modal | Mints `share_token` |
| `/api/share/[token]` | GET | — | Read-only session view |

### SSE event contract

```
event: text        data: {"delta": "Based on your love of..."}
event: context     data: {"travel_mode": "family_young_kids", "negatives": [...]}
event: cards       data: {"destinations": [ …full rows joined from Postgres… ]}
event: quick       data: {"replies": ["🗓️ Planning for Spring", …]}
event: done        data: {"session_id": "...", "expires_at": "..."}
```

`StreamingText` in [ChatContainer.tsx](src/components/chat/ChatContainer.tsx) currently fakes streaming with `setInterval`. It gets replaced by a real `text` delta consumer — that component's simulated timing is the only part of F2's UI that doesn't survive the swap.

---

## 6. Migration from mock

The frontend was built so this is a swap, not a rewrite:

| Mock | Live |
|---|---|
| [mockData.ts](src/lib/mockData.ts) `MOCK_DESTINATIONS` | `GET /api/destinations` (or server-rendered) |
| [sessionStore.ts](src/lib/sessionStore.ts) localStorage | `/api/session/*` — the `PersistedSession` type was shaped as the `sessions.state` row on purpose |
| [transitMatrix.ts](src/lib/transitMatrix.ts) | `transit_routes` lookup; the pure functions move server-side unchanged |
| [travelContext.ts](src/lib/travelContext.ts) regexes | `update_traveler_context` tool (§4.5) |
| `setTimeout` in [useWandrStore.ts](src/store/useWandrStore.ts) | SSE subscription |

The store's action signatures stay identical, so components need almost no changes.

---

## 7. Security & NFR hardening

- **Session URLs stay non-guessable** (NFR-5.3.2) — UUIDv4 from `gen_random_uuid()`. `GET /api/session/[id]` returns the same response for expired and unknown IDs; distinguishing them confirms whether a session exists and undermines the non-guessable guarantee. The frontend already shows one banner for both cases.
- **Prompt injection (TC-SEC-902)** — user text never reaches the system prompt. It stays in `messages`, and mid-conversation operator instructions use `{role: "system"}` message entries rather than rebuilding the top-level system prompt (which would also nuke the cache).
- **PII scrubbing (TC-SEC-905)** — strip email/phone patterns before persisting `state.chatMessages`.
- **Fallback (TC-NFR-805)** — on LLM timeout or an empty tool call, serve curated static cards from Postgres. The UI path already exists.
- **RLS** — `sessions` and `session_reactions` are service-role-only; the browser never talks to Postgres directly.

---

## 8. Build order

| # | Step | Gate |
|---|---|---|
| 1 | Schema + `origin_cities` seed | Migrations apply clean |
| 2 | ~~Correct the 25 records' transit data and origin assumptions~~ **✅ done** — see §0 | Plausibility check 25/25 |
| 3 | `transit_routes` seed (8 origins × 25 destinations) | Cost engine matches hand calculations |
| 4 | `/api/session/*` + swap `sessionStore.ts` | TC-504, TC-505 pass against Postgres |
| 5 | `/api/discover` with tool-constrained selection | **Adversarial test: prompt for a fictional destination; assert zero non-KB IDs** |
| 6 | Swap `travelContext.ts` for structured extraction | Suite 3 re-run live |
| 7 | Reactions + share endpoints | Suites 4, 5 re-run live |
| 8 | Full 49-test-case E2E gate | Phase 3 entry |

Step 5's adversarial test is the one that proves the central design claim. It should be automated and run in CI, not performed once by hand.

---

## 9. Open risks

| Risk | Severity | Mitigation |
|---|---|---|
| ~~App is USD-denominated for an India-only product~~ **✅ resolved 9 Aug** | — | Frontend is now INR end-to-end: `avgDailyCostINR`, `₹` tier glyphs, INR budget presets, and `formatINR()` using Indian digit grouping (₹1,20,000, not ₹120,000). The multi-currency picker is gone — it offered seven currencies for a KB the cost engine never converted. Chat budget parsing now handles `50k`, `1.5 lakh`, `Rs 75000` and `₹1,20,000`; 13/13 parser cases pass. Frontend and the schema below now agree on currency. |
| Editorial cost data goes stale | High | `last_verified_date` per row; 180-day staleness banner already built; quarterly review |
| 25 destinations is thin for category-based negative filtering | Medium | F3 blocks a whole category after 2 dismissals; a traveller ruling out two categories can hit the filter-bubble message quickly. The fallback copy exists — watch during live testing and add targeted destinations to whichever categories run thin. |
| TTFT > 5s at `effort: medium` with adaptive thinking | Medium | Sweep effort `low`/`medium`; cached prefix already removes most input cost. Measure before tuning. |
| The model calls `present_destinations` with 0 selections | Medium | Server-side fallback to curated cards (TC-NFR-805) |
| Wikivoyage CC BY-SA attribution obligations | Medium | Attribution surface in the deep-dive; legal review before launch |
| Persona/PRD rework lands late | Low | Doc-only change; does not block engineering |

---

## 10. What this plan deliberately does not do

- **No vector database.** At 25 destinations it adds a failure mode (retrieval miss) and infrastructure without adding capability. Revisit past ~200 destinations.
- **No live pricing APIs.** Layer 2 stays deferred per PRD §6.3.
- **No auth.** Sessions are the only identity in V1.
- **No Supabase Edge Functions.** Next.js Route Handlers cover it on the runtime already deployed.
