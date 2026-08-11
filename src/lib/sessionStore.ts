import { PersistedSession } from '@/types';

// Epic 5.3: 48-Hour Session Continuity. Authoritative session state now lives in the
// Supabase `sessions` table behind /api/session/[id]; this module is the client half.
//
// What stays in localStorage, and why: the sidebar's session history needs a list of
// "sessions this browser has seen". There is deliberately no server endpoint for that
// — with no accounts, a session URL is the only identity (§7), so a list-sessions API
// would hand every visitor everyone else's sessions. The index below is therefore a
// per-browser bookmark list, not a cache of state: it holds IDs and display metadata
// only, and the server remains the single source of truth for session content.

const INDEX_KEY = 'wandr:session-index';
export const SESSION_TTL_MS = 48 * 60 * 60 * 1000; // FR-5.3.4

export type RestoreResult =
  | { status: 'ok'; session: PersistedSession }
  | { status: 'expired' }
  | { status: 'missing' };

/** Sidebar-facing metadata. Never contains conversation content. */
type IndexEntry = Pick<PersistedSession, 'sessionId' | 'title' | 'createdAt' | 'expiresAt'>;

/**
 * NFR-5.3.2: UUIDv4 so session URLs are non-guessable. Generated client-side rather
 * than by the server, so an idle landing-page visit doesn't insert a database row for
 * someone who never starts a conversation. Entropy is what makes the URL safe, not
 * where it was minted.
 */
export function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC-4122 v4 from crypto.getRandomValues — never Math.random, which is guessable.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isExpired(session: Pick<PersistedSession, 'expiresAt'>): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

/** Whole hours left before expiry, floored at 0 — drives the "expires in Nh" badge. */
export function hoursUntilExpiry(session: Pick<PersistedSession, 'expiresAt'>): number {
  const ms = new Date(session.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / (60 * 60 * 1000)));
}

// ── Local index ──────────────────────────────────────────────────────────────

function readIndex(): IndexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as IndexEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: IndexEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage disabled (private mode). The session itself is
    // safe on the server and still reachable by URL — only this browser's history
    // list is lost, which is not something the user can act on.
  }
}

function upsertIndex(entry: IndexEntry): void {
  const rest = readIndex().filter((e) => e.sessionId !== entry.sessionId);
  writeIndex([entry, ...rest]);
}

// ── Server-backed operations ─────────────────────────────────────────────────

/**
 * Debounced write-behind. The store subscribes centrally and fires on every
 * meaningful change, which was free against localStorage and decidedly not free
 * against HTTP. Coalescing to one request per quiet period keeps a fast typist
 * from generating a request per keystroke.
 */
const FLUSH_DELAY_MS = 800;
let pending: PersistedSession | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  const session = pending;
  pending = null;
  flushTimer = null;
  if (!session) return;

  try {
    await fetch(`/api/session/${session.sessionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(session),
      keepalive: true,
    });
  } catch {
    // Offline or transient failure. The next state change re-sends the whole
    // session — state is sent whole, not as a delta — so a dropped write is
    // self-healing and there is nothing useful to surface here.
  }
}

// Debouncing means up to FLUSH_DELAY_MS of the conversation is only in memory at
// any moment. `visibilitychange` is the one lifecycle event that reliably fires on
// mobile when a tab is backgrounded or closed — `beforeunload` does not — so the
// queued write goes out there. Registered once, lazily, so importing this module
// on the server stays side-effect free.
let flushListenerAttached = false;

function attachFlushListener(): void {
  if (flushListenerAttached || typeof document === 'undefined') return;
  flushListenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingSave();
  });
}

export function saveSession(session: PersistedSession): void {
  if (typeof window === 'undefined') return;
  attachFlushListener();

  upsertIndex({
    sessionId: session.sessionId,
    title: session.title,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });

  pending = session;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flush(), FLUSH_DELAY_MS);
}

/** Forces any queued write out immediately — used when the tab is being hidden. */
export function flushPendingSave(): void {
  if (flushTimer) clearTimeout(flushTimer);
  void flush();
}

/**
 * FR-5.3.2 / FR-5.3.4: returns the session only if it exists AND is inside the 48h
 * window. The API deliberately cannot distinguish expired from unknown (§7), so a
 * 404 is reported as 'expired' when this browser's index says it once existed, and
 * 'missing' otherwise. That keeps the richer banner without the server ever
 * confirming whether an unknown ID was real.
 */
export async function loadSession(sessionId: string): Promise<RestoreResult> {
  const knownLocally = readIndex().some((e) => e.sessionId === sessionId);

  let res: Response;
  try {
    res = await fetch(`/api/session/${sessionId}`, { cache: 'no-store' });
  } catch {
    return { status: 'missing' };
  }

  if (res.status === 404) {
    if (knownLocally) removeFromIndex(sessionId);
    return { status: knownLocally ? 'expired' : 'missing' };
  }
  if (!res.ok) return { status: 'missing' };

  let session: PersistedSession;
  try {
    session = (await res.json()) as PersistedSession;
  } catch {
    return { status: 'missing' };
  }

  upsertIndex({
    sessionId: session.sessionId,
    title: session.title,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });

  return { status: 'ok', session };
}

function removeFromIndex(sessionId: string): void {
  writeIndex(readIndex().filter((e) => e.sessionId !== sessionId));
}

export function deleteSession(sessionId: string): void {
  removeFromIndex(sessionId);
  if (typeof window === 'undefined') return;
  void fetch(`/api/session/${sessionId}`, { method: 'DELETE', keepalive: true }).catch(() => {
    // Removed from this browser's history regardless; the row expires on its own
    // within 48 hours even if the request never lands.
  });
}

/**
 * This browser's sessions, newest first, with expired ones swept. Backs the history
 * sidebar so it can never offer a session that would immediately bounce the user to
 * the expired banner. Reads the local index only — see the note at the top of this
 * file for why there is no server-side equivalent.
 */
export function listLiveSessions(): PersistedSession[] {
  const live = readIndex().filter((e) => !isExpired(e));
  if (live.length !== readIndex().length) writeIndex(live);

  // The sidebar renders title/dates only; the remaining PersistedSession fields are
  // filled with empty values rather than fetched, so opening the drawer doesn't fire
  // a request per session. Hydration happens when a session is actually opened.
  return live
    .map((e) => ({
      ...e,
      moodText: '',
      selectedTileIds: [],
      constraints: {},
      chatMessages: [],
      savedDestinations: [],
      dismissedDestinationIds: [],
      likedDestinationIds: [],
      dismissedCategoryCounts: {},
      crystallizedDestinationId: null,
      hasReflectedStyle: false,
      lastLearningAckAtMessageCount: 0,
      maxBudgetINR: 0,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
