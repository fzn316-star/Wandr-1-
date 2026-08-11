import { create } from 'zustand';
import {
  Destination,
  DestinationCategory,
  PersistedSession,
  UserConstraints,
  ChatMessage,
  TravelMode,
  OriginCity,
} from '@/types';
import { MOCK_DESTINATIONS, MOCK_MOOD_TILES } from '@/lib/mockData';
import { getEffectiveTransitTier, estimateTransitCostINR, formatINR, ORIGIN_CITIES } from '@/lib/transitMatrix';
import {
  buildStyleSummary,
  CATEGORY_LABELS,
  deriveDestinationCategories,
  detectContextFromText,
  detectStyleSignals,
  filterByNegatives,
  mergeStyle,
  TRAVEL_MODE_FOCUS,
  TRAVEL_MODE_PHRASES,
} from '@/lib/travelContext';
import {
  createSessionId,
  deleteSession,
  listLiveSessions,
  loadSession,
  saveSession,
  SESSION_TTL_MS,
} from '@/lib/sessionStore';
import { streamDiscovery } from '@/lib/discoverClient';

const NEGATIVE_STOPWORDS = new Set(['problem', 'worries', 'way', 'idea', 'wait', 'doubt', 'rush', 'clue']);

/**
 * Phase 2: destination recommendations come from /api/discover, streamed token by
 * token, with card facts joined from Postgres server-side. Replaces the setTimeout
 * mock that previously invented both the prose and the picks.
 *
 * An empty AI message is appended immediately and mutated in place as deltas
 * arrive, so the UI can render partial text without any special-casing.
 */
function runDiscovery(
  set: (partial: Partial<WandrStore> | ((s: WandrStore) => Partial<WandrStore>)) => void,
  get: () => WandrStore,
  opts: { message: string; prefix?: string }
): void {
  const aiId = `msg-${Date.now()}-ai`;

  const patch = (fields: Partial<ChatMessage>) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) => (m.id === aiId ? { ...m, ...fields } : m)),
    }));

  set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        id: aiId,
        sender: 'ai',
        text: opts.prefix ?? '',
        timestamp: timestamp(),
        isStreaming: true,
      } as ChatMessage,
    ],
    isAiThinking: true,
  }));

  // Only the conversation is sent — constraints and negatives stay client-side
  // until step 6 replaces the regex extraction with a structured tool call.
  const history = get()
    .chatMessages.filter((m) => m.id !== aiId)
    .slice(-8)
    .map((m) => ({ sender: m.sender, text: m.text }));

  void streamDiscovery(
    { message: opts.message, history, originCity: get().constraints.originCity },
    {
      onTextDelta: (delta) =>
        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === aiId ? { ...m, text: m.text + delta } : m
          ),
        })),
      onCards: (destinations, isFallback) =>
        patch({ destinations, uncertaintyFlag: isFallback }),
      onQuickReplies: (replies) => patch({ followUpQuestions: replies }),
      onDone: () => {
        patch({ isStreaming: false });
        set({ isAiThinking: false });
      },
      onError: (message) => {
        patch({
          text: `${message} Your session is saved — try again in a moment.`,
          isStreaming: false,
        });
        set({ isAiThinking: false });
      },
    }
  );
}

function detectNegativesFromText(text: string): string[] {
  const patterns = [
    /\bno\s+([a-z][a-z\s]{2,24}?)(?:[.,!?]|$)/gi,
    /\bnot\s+(?:a\s+fan\s+of|into|keen\s+on)\s+([a-z][a-z\s]{2,24}?)(?:[.,!?]|$)/gi,
    /\bnothing\s+in\s+([a-z][a-z\s]{2,24}?)(?:[.,!?]|$)/gi,
    /\bcan'?t\s+do\s+([a-z][a-z\s]{2,24}?)(?:[.,!?]|$)/gi,
    /\b(?:hate|avoid)\s+([a-z][a-z\s]{2,24}?)(?:[.,!?]|$)/gi,
  ];
  const found: string[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const phrase = m[1].trim().toLowerCase();
      const words = phrase.split(/\s+/);
      if (phrase.length > 2 && words.length <= 4 && !NEGATIVE_STOPWORDS.has(words[0])) {
        found.push(phrase);
      }
    }
  }
  return Array.from(new Set(found));
}

// Epic 7.1: Total-Budget Duration Optimizer — origin-aware via the static Transit Cost Matrix,
// kept in one place so chat trade-off messaging and the Deep-Dive modal never drift apart.
function computeAffordableDays(destination: Destination, budget: number, originCity?: OriginCity | null): number {
  // Prefer the real per-route figure joined from `transit_routes`. The tier
  // estimate collapses every journey into one of four numbers, which made
  // Delhi→Agra and Delhi→Andamans cost the same — falls back to it only when
  // no origin was set, or the route is missing from the table.
  const transitEstimate =
    destination.originTransit?.costINR ??
    estimateTransitCostINR(getEffectiveTransitTier(destination, originCity));
  const netGroundBudget = Math.max(0, budget - transitEstimate);
  return Math.round(netGroundBudget / destination.quickStats.avgDailyCostINR);
}

/**
 * Pulls a budget figure out of free text. Indian travellers write amounts in ways a plain
 * digit match gets wrong: "50k", "1.5 lakh", "₹40,000", "80,000". Parsing only bare digits
 * would read "1.5 lakh" as 1 and silently produce a nonsense trip length.
 */
function parseBudgetINR(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, '');

  const lakh = t.match(/(?:₹|rs\.?|inr)?\s?(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/);
  if (lakh) return Math.round(Number(lakh[1]) * 100000);

  const thousand = t.match(/(?:₹|rs\.?|inr)?\s?(\d+(?:\.\d+)?)\s*k\b/);
  if (thousand) return Math.round(Number(thousand[1]) * 1000);

  // Bare number — require 4+ digits so a stray "3 days" or "2 people" isn't read as a budget.
  const plain = t.match(/(?:₹|rs\.?|inr)?\s?(\d{4,7})\b/);
  if (plain) return Number(plain[1]);

  return null;
}

// Epic 5.1: Reaction-Based Learning — derive the dominant vibe from positive signals
// (liked + saved destinations) so the AI can acknowledge what it's noticing.
function computeDominantVibe(likedIds: string[], savedIds: string[]): string | null {
  const tagCounts: Record<string, number> = {};
  [...likedIds, ...savedIds].forEach((id) => {
    const dest = MOCK_DESTINATIONS.find((d) => d.id === id);
    dest?.vibeTags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

/**
 * DP-1 / FR-2.1.1: never more than 4 cards per response, and FR-3.3.3: never a card from a
 * category the user has ruled out. Returns an empty array when negatives filter everything
 * out, which the caller surfaces as a "your filters are too tight" message (NFR-3.3.3).
 */
function pickDestinations(
  count: number,
  blockedCategories: DestinationCategory[],
  dismissedIds: string[]
): Destination[] {
  const available = filterByNegatives(MOCK_DESTINATIONS, blockedCategories).filter(
    (d) => !dismissedIds.includes(d.id)
  );
  return available.slice(0, Math.min(count, 4));
}

const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface WandrStore {
  // Session & Navigation State
  sessionId: string;
  sessionCreatedAt: string;
  sessionExpiresAt: string;
  ensureSessionId: () => void;
  currentView: 'landing' | 'chat';
  setCurrentView: (view: 'landing' | 'chat') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Epic 5.3: 48-Hour Session Continuity
  liveSessions: PersistedSession[];
  refreshLiveSessions: () => void;
  // Async since Phase 2: session state is fetched from /api/session/[id] rather
  // than read synchronously out of localStorage.
  hydrateSession: (sessionId: string) => Promise<'ok' | 'expired' | 'missing'>;
  expiredSessionNotice: boolean;
  flagExpiredSession: () => void;
  clearExpiredSessionNotice: () => void;
  createNewChat: () => void;
  deleteSessionById: (sessionId: string) => void;

  // Mood & Constraints Input
  moodText: string;
  setMoodText: (text: string) => void;
  selectedTileIds: string[];
  toggleMoodTile: (id: string) => void;
  clearMoodTiles: () => void;

  // Budget Slider & Checkbox Discovery State
  maxBudgetINR: number;
  setMaxBudgetINR: (budget: number) => void;
  budgetCurrency: string;
  setBudgetCurrency: (currency: string) => void;
  travelPace: 'chill' | 'balanced' | 'fast';
  setTravelPace: (pace: 'chill' | 'balanced' | 'fast') => void;
  durationDays: number;
  setDurationDays: (days: number) => void;
  selectedCheckboxVibes: string[];
  toggleCheckboxVibe: (vibe: string) => void;
  clearCheckboxVibes: () => void;
  discoveryTab: 'checkboxes' | 'tiles';
  setDiscoveryTab: (tab: 'checkboxes' | 'tiles') => void;

  constraints: UserConstraints;
  updateConstraints: (newConstraints: Partial<UserConstraints>) => void;
  setTravelerMode: (mode: TravelMode) => void;
  addExplicitNegative: (category: string) => void;
  addImplicitNegative: (category: string) => void;
  removeNegative: (category: string) => void;

  // Epic 3.2: Travel Style Calibration
  hasReflectedStyle: boolean;
  confirmStyleReflection: (confirmed: boolean) => void;

  // Epic 3.3: implicit negative learning by destination category
  dismissedCategoryCounts: Record<string, number>;
  blockedCategories: DestinationCategory[];
  unblockCategory: (category: DestinationCategory) => void;

  // Active Chat State
  chatMessages: ChatMessage[];
  isAiThinking: boolean;
  submitMoodPrompt: (customText?: string) => void;
  sendChatMessage: (messageText: string) => void;
  sendFollowUpAnswer: (answerText: string) => void;
  askWhyDestination: (destination: Destination) => void;

  // Destination Actions (Reactions)
  savedDestinations: Destination[];
  dismissedDestinationIds: string[];
  likedDestinationIds: string[];
  saveDestination: (destination: Destination) => void;
  unsaveDestination: (destinationId: string) => void;
  dismissDestination: (destinationId: string, reasonChip?: string) => void;
  toggleLikeDestination: (destinationId: string) => void;

  // Epic 5: Evolving Session Intelligence
  lastLearningAckAtMessageCount: number;
  crystallizedDestinationId: string | null;

  // Active Modals / Overlays
  activeDeepDiveDestination: Destination | null;
  setActiveDeepDiveDestination: (destination: Destination | null) => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (open: boolean) => void;
  comparisonDestinationIds: string[];
  toggleComparisonSelection: (destinationId: string) => void;
}

export const useWandrStore = create<WandrStore>((set, get) => ({
  // Left empty so server and client render identically on first paint;
  // the real UUID is generated client-side after mount (see ensureSessionId).
  sessionId: '',
  sessionCreatedAt: '',
  sessionExpiresAt: '',
  ensureSessionId: () => {
    if (!get().sessionId) {
      const now = Date.now();
      set({
        sessionId: createSessionId(),
        sessionCreatedAt: new Date(now).toISOString(),
        sessionExpiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
      });
    }
  },
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),
  isSidebarOpen: false,
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  liveSessions: [],
  refreshLiveSessions: () => set({ liveSessions: listLiveSessions() }),

  /**
   * FR-5.3.2: restores conversation, saved destinations, and learned preferences from a
   * session URL. FR-5.3.3 adds the "welcome back" greeting — prior greetings are stripped
   * first so a session restored twice doesn't accumulate them.
   */
  hydrateSession: async (sessionId) => {
    if (get().sessionId === sessionId && get().chatMessages.length > 0) return 'ok';

    const result = await loadSession(sessionId);
    if (result.status !== 'ok') return result.status;

    const s = result.session;
    const priorMessages = s.chatMessages.filter((m) => !m.id.startsWith('restore-greeting'));

    const savedNames = s.savedDestinations.map((d) => d.name);
    const greeting: ChatMessage | null =
      savedNames.length > 0
        ? {
            id: `restore-greeting-${Date.now()}`,
            sender: 'ai',
            text: `Welcome back! Last time you were excited about ${
              savedNames.length === 1
                ? savedNames[0]
                : `${savedNames.slice(0, -1).join(', ')} and ${savedNames[savedNames.length - 1]}`
            }. Want to pick up there?`,
            timestamp: timestamp(),
            followUpQuestions: ['📍 Yes, pick up where I left off', '🔄 Actually, show me something new'],
          }
        : null;

    set({
      sessionId: s.sessionId,
      sessionCreatedAt: s.createdAt,
      sessionExpiresAt: s.expiresAt,
      moodText: s.moodText,
      selectedTileIds: s.selectedTileIds,
      constraints: s.constraints,
      chatMessages: greeting ? [...priorMessages, greeting] : priorMessages,
      savedDestinations: s.savedDestinations,
      dismissedDestinationIds: s.dismissedDestinationIds,
      likedDestinationIds: s.likedDestinationIds,
      dismissedCategoryCounts: s.dismissedCategoryCounts || {},
      blockedCategories: Object.entries(s.dismissedCategoryCounts || {})
        .filter(([, count]) => count >= 2)
        .map(([category]) => category as DestinationCategory),
      crystallizedDestinationId: s.crystallizedDestinationId,
      hasReflectedStyle: s.hasReflectedStyle,
      lastLearningAckAtMessageCount: s.lastLearningAckAtMessageCount,
      maxBudgetINR: s.maxBudgetINR,
      currentView: 'chat',
      isAiThinking: false,
    });

    return 'ok';
  },

  expiredSessionNotice: false,
  flagExpiredSession: () => set({ expiredSessionNotice: true }),
  clearExpiredSessionNotice: () => set({ expiredSessionNotice: false }),

  /**
   * FR-5.1.4 / FR-5.3.5: a fresh session with a new UUID. Saved destinations are a deliberate
   * collection rather than learned inference, so they deliberately survive (per DP-3's spirit).
   */
  createNewChat: () => {
    const now = Date.now();
    set((state) => ({
      sessionId: createSessionId(),
      sessionCreatedAt: new Date(now).toISOString(),
      sessionExpiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
      currentView: 'landing',
      moodText: '',
      selectedTileIds: [],
      chatMessages: [],
      constraints: { explicitNegatives: [], implicitNegatives: [] },
      likedDestinationIds: [],
      dismissedDestinationIds: [],
      comparisonDestinationIds: [],
      dismissedCategoryCounts: {},
      blockedCategories: [],
      hasReflectedStyle: false,
      lastLearningAckAtMessageCount: 0,
      crystallizedDestinationId: null,
      expiredSessionNotice: false,
      isAiThinking: false,
      savedDestinations: state.savedDestinations,
    }));
  },

  deleteSessionById: (sessionId) => {
    deleteSession(sessionId);
    set({ liveSessions: listLiveSessions() });
  },

  moodText: '',
  setMoodText: (text) => set({ moodText: text }),
  selectedTileIds: [],
  toggleMoodTile: (id) =>
    set((state) => {
      const exists = state.selectedTileIds.includes(id);
      if (exists) {
        return { selectedTileIds: state.selectedTileIds.filter((t) => t !== id) };
      } else {
        if (state.selectedTileIds.length >= 3) return state;
        return { selectedTileIds: [...state.selectedTileIds, id] };
      }
    }),
  clearMoodTiles: () => set({ selectedTileIds: [] }),

  maxBudgetINR: 2000,
  setMaxBudgetINR: (budget) => set({ maxBudgetINR: budget }),
  budgetCurrency: 'USD',
  setBudgetCurrency: (currency) => set({ budgetCurrency: currency }),
  travelPace: 'balanced',
  setTravelPace: (pace) => set({ travelPace: pace }),
  durationDays: 7,
  setDurationDays: (days) => set({ durationDays: days }),
  selectedCheckboxVibes: [],
  toggleCheckboxVibe: (vibe) =>
    set((state) => {
      const exists = state.selectedCheckboxVibes.includes(vibe);
      if (exists) {
        return { selectedCheckboxVibes: state.selectedCheckboxVibes.filter((v) => v !== vibe) };
      }
      return { selectedCheckboxVibes: [...state.selectedCheckboxVibes, vibe] };
    }),
  clearCheckboxVibes: () => set({ selectedCheckboxVibes: [] }),
  discoveryTab: 'tiles',
  setDiscoveryTab: (tab) => set({ discoveryTab: tab }),

  constraints: {
    explicitNegatives: [],
    implicitNegatives: [],
  },
  updateConstraints: (newConstraints) =>
    set((state) => ({
      constraints: { ...state.constraints, ...newConstraints },
    })),
  setTravelerMode: (mode) =>
    set((state) => ({
      constraints: { ...state.constraints, travelMode: mode },
    })),
  addExplicitNegative: (category) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        explicitNegatives: [...(state.constraints.explicitNegatives || []), category],
      },
    })),
  addImplicitNegative: (category) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        implicitNegatives: [...(state.constraints.implicitNegatives || []), category],
      },
    })),
  removeNegative: (category) =>
    set((state) => ({
      constraints: {
        ...state.constraints,
        explicitNegatives: (state.constraints.explicitNegatives || []).filter((c) => c !== category),
        implicitNegatives: (state.constraints.implicitNegatives || []).filter((c) => c !== category),
      },
    })),

  hasReflectedStyle: false,

  // FR-3.2.3: the user confirms or corrects the reflected profile. A correction clears the
  // inferred style so the next few turns can rebuild it from fresh signals.
  confirmStyleReflection: (confirmed) => {
    if (confirmed) {
      get().sendChatMessage("Yes, that's me — you've got my style right.");
    } else {
      set((state) => ({ constraints: { ...state.constraints, travelStyle: {} } }));
      get().sendChatMessage("Not quite — let me tweak that.");
    }
  },

  dismissedCategoryCounts: {},
  blockedCategories: [],
  unblockCategory: (category) =>
    set((state) => ({
      blockedCategories: state.blockedCategories.filter((c) => c !== category),
      dismissedCategoryCounts: { ...state.dismissedCategoryCounts, [category]: 0 },
      constraints: {
        ...state.constraints,
        implicitNegatives: (state.constraints.implicitNegatives || []).filter(
          (n) => n !== CATEGORY_LABELS[category]
        ),
      },
    })),

  chatMessages: [],
  isAiThinking: false,

  submitMoodPrompt: (customText) => {
    const textToSubmit = customText !== undefined ? customText : get().moodText;
    const tileIds = get().selectedTileIds;

    if (!textToSubmit.trim() && tileIds.length === 0) return;

    get().ensureSessionId();

    // Convert tile IDs to human-readable labels (e.g. "🏔️ Wild & Untamed")
    const tileLabels = MOCK_MOOD_TILES.filter((t) => tileIds.includes(t.id)).map(
      (t) => `${t.emoji} ${t.label}`
    );
    const readableTilesString = tileLabels.join(' + ');

    set({ isAiThinking: true, currentView: 'chat' });

    let userPromptDisplay = textToSubmit.trim();
    if (tileLabels.length > 0) {
      userPromptDisplay = userPromptDisplay
        ? `${userPromptDisplay} (Moods: ${readableTilesString})`
        : `Looking for destinations with vibes: ${readableTilesString}`;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: userPromptDisplay,
      timestamp: timestamp(),
    };

    set({ chatMessages: [...get().chatMessages, userMsg] });

    const aiPromptReference = textToSubmit.trim() ? `"${textToSubmit.trim()}"` : readableTilesString;

    // Epic 3.1 / 3.2 / 3.3: passively infer context, style, and negatives from the raw prompt
    const previousMode = get().constraints.travelMode;
    const detectedContext = detectContextFromText(textToSubmit);
    const detectedNegatives = detectNegativesFromText(textToSubmit);
    const styleSignals = detectStyleSignals(textToSubmit);

    if (detectedContext) get().setTravelerMode(detectedContext);
    get().updateConstraints({ travelStyle: mergeStyle(get().constraints.travelStyle, styleSignals) });

    if (detectedNegatives.length > 0) {
      const existing = new Set(get().constraints.explicitNegatives || []);
      detectedNegatives.forEach((neg) => {
        if (!existing.has(neg)) {
          get().addExplicitNegative(neg);
          existing.add(neg);
        }
      });
    }

    let contextNote = '';
    if (detectedContext && detectedContext !== previousMode) {
      contextNote = `Noting you're ${TRAVEL_MODE_PHRASES[detectedContext]} — I'll weight ${TRAVEL_MODE_FOCUS[detectedContext]}. `;
    }
    const negativesNote = detectedNegatives.length > 0 ? `Also ruling out: ${detectedNegatives.join(', ')}. ` : '';
    const openingNote = contextNote || negativesNote ? `${contextNote}${negativesNote}\n\n` : '';

    // `openingNote` carries the locally-inferred context acknowledgement ("Noting
    // you're travelling with young kids…"). It is prepended to the streamed reply
    // rather than sent to the model, so the acknowledgement appears instantly
    // while the recommendation is still being generated.
    runDiscovery(set, get, { message: userPromptDisplay, prefix: openingNote });
  },

  sendChatMessage: (messageText) => {
    if (!messageText.trim()) return;

    // FR-5.1.4: "Start fresh" resets all learned session context immediately (<1s)
    if (/^\s*(start fresh|start over|reset (everything|session|my preferences))\s*$/i.test(messageText)) {
      get().createNewChat();
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: messageText,
      timestamp: timestamp(),
    };

    set({ chatMessages: [...get().chatMessages, userMsg], isAiThinking: true });

    setTimeout(() => {
      const lower = messageText.toLowerCase();
      const pushAi = (msg: ChatMessage) =>
        set({ chatMessages: [...get().chatMessages, msg], isAiThinking: false });

      // FR-3.3.5: let the user query their own negative preference list directly
      if (/what.*(said no to|ruled out|deal.?breakers?|negatives?)/i.test(lower)) {
        const allNegatives = [
          ...(get().constraints.explicitNegatives || []),
          ...(get().constraints.implicitNegatives || []),
        ];
        pushAi({
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text:
            allNegatives.length > 0
              ? `So far you've ruled out: ${Array.from(new Set(allNegatives)).join(', ')}. I won't suggest those.`
              : `You haven't ruled anything out yet — every option's still on the table!`,
          timestamp: timestamp(),
        });
        return;
      }

      const isPivot = /\b(actually|instead|rather|on second thought|changed my mind|nvm|never ?mind)\b/.test(lower);

      // Capture the origin city if the user tapped a "Travelling from X" quick reply or typed it
      const originReplyMatch = ORIGIN_CITIES.find((c) => lower.includes(c.toLowerCase()));
      if (originReplyMatch) {
        get().updateConstraints({ originCity: originReplyMatch });
      }

      // Epic 3.1 / 3.2 / 3.3: passively infer context, style, and negatives from this message
      const previousMode = get().constraints.travelMode;
      const detectedContext = detectContextFromText(messageText);
      const detectedNegatives = detectNegativesFromText(messageText);
      const styleSignals = detectStyleSignals(messageText);

      if (detectedContext) get().setTravelerMode(detectedContext);
      get().updateConstraints({ travelStyle: mergeStyle(get().constraints.travelStyle, styleSignals) });

      if (detectedNegatives.length > 0) {
        const existing = new Set(get().constraints.explicitNegatives || []);
        detectedNegatives.forEach((neg) => {
          if (!existing.has(neg)) {
            get().addExplicitNegative(neg);
            existing.add(neg);
          }
        });
      }

      // FR-3.1.3 / TC-302: a context correction is acknowledged explicitly and takes effect
      // on this very response, not the next one.
      let contextNote = '';
      if (detectedContext && detectedContext !== previousMode) {
        contextNote = previousMode
          ? `Got it — switching to ${TRAVEL_MODE_PHRASES[detectedContext]} mode. I'll prioritise ${TRAVEL_MODE_FOCUS[detectedContext]} from here. `
          : `Noting you're ${TRAVEL_MODE_PHRASES[detectedContext]} — I'll weight ${TRAVEL_MODE_FOCUS[detectedContext]}. `;
      }
      const negativesNote = detectedNegatives.length > 0 ? `Also ruling out: ${detectedNegatives.join(', ')}. ` : '';

      // FR-5.1.2 / 5.1.3: after 4+ signals, occasionally acknowledge what the AI is noticing
      const totalSignals =
        get().likedDestinationIds.length + get().savedDestinations.length + get().dismissedDestinationIds.length;
      const messagesSinceAck = get().chatMessages.length - get().lastLearningAckAtMessageCount;
      const dominantVibe = computeDominantVibe(
        get().likedDestinationIds,
        get().savedDestinations.map((d) => d.id)
      );
      let learningNote = '';
      if (totalSignals >= 4 && messagesSinceAck >= 3 && dominantVibe) {
        learningNote = `I'm noticing you're drawn to ${dominantVibe.toLowerCase()} — let me lean into that. `;
        set({ lastLearningAckAtMessageCount: get().chatMessages.length });
      }

      // Story 5.2: let the user explicitly step back out of a crystallized destination
      if (/show (me )?more options|keep exploring|other options|explore more/i.test(lower)) {
        set({ crystallizedDestinationId: null });
      }

      const openingNote =
        contextNote || negativesNote || learningNote ? `${contextNote}${negativesNote}${learningNote}\n\n` : '';

      const blocked = get().blockedCategories;
      let cards = pickDestinations(3, blocked, get().dismissedDestinationIds);

      let aiText = `I've updated your travel options based on: "${messageText}".`;
      let followUpChips = [
        '🌿 Show quieter off-the-beaten-track spots',
        '🍷 Filter by places with great food',
        // Names the first card actually on screen rather than a hardcoded destination
        ...(cards[0] ? [`⚡ Looks great! Let's deep-dive into ${cards[0].name}`] : []),
      ];

      if (lower.includes('budget') || lower.includes('cost') || originReplyMatch) {
        // FR-7.1.1/7.1.2: pull a typed rupee figure if present, else use the stored budget
        const typedBudget = parseBudgetINR(messageText);
        const tradeOffBudget = typedBudget ?? get().maxBudgetINR;
        if (typedBudget) set({ maxBudgetINR: typedBudget });

        const originCity = get().constraints.originCity;
        const tradeOffs = cards
          .slice(0, 2)
          .map((d) => ({ d, days: computeAffordableDays(d, tradeOffBudget, originCity) }));
        const allTooShort = tradeOffs.length > 0 && tradeOffs.every((t) => t.days < 3);
        const originPrefix = originReplyMatch ? `Got it — travelling from ${originReplyMatch}. ` : '';

        if (allTooShort) {
          // FR-7.1.3: proactively flag insufficient budget rather than returning invalid durations
          aiText = `${originPrefix}Heads up — with a ${formatINR(tradeOffBudget)} budget, transit alone eats most of it for these spots (you'd get under 3 days on the ground). Here's what's realistic:\n${tradeOffs
            .map((t) => `• ${t.d.name}: ~${Math.max(t.days, 0)} days`)
            .join('\n')}\n\nWant me to suggest closer, cheaper-to-reach alternatives instead?`;
          followUpChips = ['🌎 Show closer/cheaper alternatives', '💰 Bump my budget up'];
        } else if (tradeOffs.length > 0) {
          aiText = `${originPrefix}With a ${formatINR(tradeOffBudget)} budget: ${tradeOffs
            .map((t) => `${t.d.name} could work for about ${t.days} days`)
            .join(', or ')}.`;
          followUpChips = ['✈️ Show options under ₹30,000 total', '🏨 Show places with cheaper ground stays'];
        }

        // FR-1.3.7: ask for the departure city once, if not already captured
        if (!originCity) {
          aiText += `\n\nOne thing that'd sharpen this: which city are you starting from? Transit cost swings the math a lot.`;
          followUpChips = ORIGIN_CITIES.map((c) => `✈️ Travelling from ${c}`);
        }
      } else if (lower.includes('flexible') || lower.includes('surprise')) {
        aiText = `Keeping dates flexible! Here are top recommendations with ideal year-round climates:`;
      }

      if (isPivot) {
        aiText = `Love the pivot! Let me rethink with that in mind — ${aiText.charAt(0).toLowerCase()}${aiText.slice(1)}`;
      }

      // NFR-3.3.3: never let accumulated negatives silently produce an empty response —
      // tell the user their filters are too tight and give them a one-tap way out.
      if (cards.length === 0) {
        pushAi({
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text:
            blocked.length > 0
              ? `${openingNote}I'm running out of room — between everything you've ruled out (${blocked
                  .map((c) => CATEGORY_LABELS[c])
                  .join(', ')}) there's nothing left in the knowledge base that fits. Want to open one of those back up?`
              : `${openingNote}You've now passed on everything I had lined up. Want to start fresh so I can rebuild from scratch?`,
          timestamp: timestamp(),
          followUpQuestions:
            blocked.length > 0
              ? blocked.map((c) => `↩️ Re-open ${CATEGORY_LABELS[c]}`)
              : ['🔄 Start fresh'],
        });
        return;
      }

      // The general recommendation path now streams from /api/discover. The
      // branches above stay local: they answer questions about the session's own
      // state (negatives, budget arithmetic, filter bubbles) which the model has
      // no visibility into and no business guessing at.
      set({ isAiThinking: false });
      runDiscovery(set, get, { message: messageText, prefix: openingNote });

      // FR-3.2.2 / NFR-3.2.2: after 3+ user turns, reflect the inferred style back exactly
      // once per session, as its own confirmable card rather than buried in prose.
      const userTurns = get().chatMessages.filter((m) => m.sender === 'user').length;
      if (!get().hasReflectedStyle && userTurns >= 3) {
        const summary = buildStyleSummary(get().constraints.travelStyle || {});
        if (summary) {
          set({ hasReflectedStyle: true });
          setTimeout(() => {
            set({
              chatMessages: [
                ...get().chatMessages,
                {
                  id: `msg-${Date.now()}-style`,
                  sender: 'ai',
                  text: summary,
                  timestamp: timestamp(),
                  styleReflection: summary,
                },
              ],
            });
          }, 700);
        }
      }
    }, 1000);
  },

  sendFollowUpAnswer: (answerText) => {
    // Re-opening a category from the filter-bubble prompt is a state change, not a question
    const reopenMatch = answerText.match(/^↩️ Re-open (.+)$/);
    if (reopenMatch) {
      const entry = (Object.entries(CATEGORY_LABELS) as [DestinationCategory, string][]).find(
        ([, label]) => label === reopenMatch[1]
      );
      if (entry) {
        get().unblockCategory(entry[0]);
        get().sendChatMessage(`Let's put ${entry[1]} back on the table.`);
        return;
      }
    }
    get().sendChatMessage(answerText);
  },

  askWhyDestination: (destination) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: `Why do you think ${destination.name} is a good fit for me?`,
      timestamp: timestamp(),
    };

    set({ chatMessages: [...get().chatMessages, userMsg], isAiThinking: true });

    setTimeout(() => {
      const reasons = destination.whyYouWillLoveIt
        .slice(0, 3)
        .map((r) => `• ${r}`)
        .join('\n');

      let text = `Good question — here's my reasoning for ${destination.name}:\n\n"${destination.matchRationale}"\n\nSpecifically:\n${reasons}\n\nThis is grounded in the Layer 1 knowledge base, not a guess — I'll flag it if anything's uncertain.`;

      // Story 5.2: Intent Crystallization — saved + asked "why" on the same destination
      // is a strong signal the user has narrowed in. Shift tone from exploration to activation.
      let followUpQuestions: string[] | undefined;
      const isSaved = get().savedDestinations.some((d) => d.id === destination.id);
      if (isSaved && get().crystallizedDestinationId !== destination.id) {
        set({ crystallizedDestinationId: destination.id });
        text += `\n\nIt sounds like ${destination.name} is calling you! Want me to go deeper — best time to visit, where to stay, what to eat? Or should I keep exploring other options?`;
        followUpQuestions = ['🗺️ Yes, help me plan around this', '🔍 Actually, show me more options'];
      }

      set({
        chatMessages: [
          ...get().chatMessages,
          {
            id: `msg-${Date.now()}-ai`,
            sender: 'ai',
            text,
            timestamp: timestamp(),
            uncertaintyFlag: destination.isUncertain,
            followUpQuestions,
          },
        ],
        isAiThinking: false,
      });
    }, 900);
  },

  savedDestinations: [],
  dismissedDestinationIds: [],
  likedDestinationIds: [],
  lastLearningAckAtMessageCount: 0,
  crystallizedDestinationId: null,

  saveDestination: (destination) =>
    set((state) => {
      if (state.savedDestinations.some((d) => d.id === destination.id)) return state;
      return { savedDestinations: [...state.savedDestinations, destination] };
    }),

  toggleLikeDestination: (destinationId) =>
    set((state) => {
      const exists = state.likedDestinationIds.includes(destinationId);
      return {
        likedDestinationIds: exists
          ? state.likedDestinationIds.filter((id) => id !== destinationId)
          : [...state.likedDestinationIds, destinationId],
      };
    }),

  unsaveDestination: (destinationId) =>
    set((state) => ({
      savedDestinations: state.savedDestinations.filter((d) => d.id !== destinationId),
      comparisonDestinationIds: state.comparisonDestinationIds.filter((id) => id !== destinationId),
    })),

  /**
   * FR-3.3.2 / NFR-3.3.2: implicit negative learning. Two dismissals of the same category —
   * not one — block that category for the rest of the session, and the AI says so unprompted
   * rather than waiting to be asked (TC-305).
   */
  dismissDestination: (destinationId, reasonChip) => {
    const destination = MOCK_DESTINATIONS.find((d) => d.id === destinationId);
    const categories = destination ? deriveDestinationCategories(destination) : [];

    const counts = { ...get().dismissedCategoryCounts };
    const newlyBlocked: DestinationCategory[] = [];

    categories.forEach((category) => {
      counts[category] = (counts[category] || 0) + 1;
      if (counts[category] === 2 && !get().blockedCategories.includes(category)) {
        newlyBlocked.push(category);
      }
    });

    set((state) => ({
      dismissedDestinationIds: [...state.dismissedDestinationIds, destinationId],
      dismissedCategoryCounts: counts,
      blockedCategories: [...state.blockedCategories, ...newlyBlocked],
      constraints: {
        ...state.constraints,
        implicitNegatives: [
          ...(state.constraints.implicitNegatives || []),
          ...(reasonChip ? [reasonChip] : []),
          ...newlyBlocked.map((c) => CATEGORY_LABELS[c]),
        ],
      },
    }));

    if (newlyBlocked.length > 0) {
      setTimeout(() => {
        set({
          chatMessages: [
            ...get().chatMessages,
            {
              id: `msg-${Date.now()}-implicit`,
              sender: 'ai',
              text: `Noticed you've passed on a couple of ${newlyBlocked
                .map((c) => CATEGORY_LABELS[c])
                .join(' and ')} — I'll steer away from those unless you tell me otherwise.`,
              timestamp: timestamp(),
              followUpQuestions: newlyBlocked.map((c) => `↩️ Re-open ${CATEGORY_LABELS[c]}`),
            },
          ],
        });
      }, 600);
    }
  },

  activeDeepDiveDestination: null,
  setActiveDeepDiveDestination: (destination) => set({ activeDeepDiveDestination: destination }),
  isComparisonOpen: false,
  setIsComparisonOpen: (open) => set({ isComparisonOpen: open }),
  comparisonDestinationIds: [],
  toggleComparisonSelection: (destinationId) =>
    set((state) => {
      const exists = state.comparisonDestinationIds.includes(destinationId);
      if (exists) {
        return { comparisonDestinationIds: state.comparisonDestinationIds.filter((id) => id !== destinationId) };
      }
      if (state.comparisonDestinationIds.length >= 3) return state;
      return { comparisonDestinationIds: [...state.comparisonDestinationIds, destinationId] };
    }),
}));

/**
 * FR-5.3.1: every meaningful state change is written back to the session record, so closing
 * the tab mid-conversation loses nothing. Subscribing centrally beats sprinkling save calls
 * through a dozen actions — there's no path that can forget to persist.
 *
 * Only sessions that have actually started a conversation are written, so idle landing-page
 * keystrokes don't fill storage with empty records.
 */
useWandrStore.subscribe((state, prev) => {
  if (!state.sessionId || state.chatMessages.length === 0) return;

  const unchanged =
    state.chatMessages === prev.chatMessages &&
    state.savedDestinations === prev.savedDestinations &&
    state.constraints === prev.constraints &&
    state.dismissedDestinationIds === prev.dismissedDestinationIds &&
    state.likedDestinationIds === prev.likedDestinationIds &&
    state.crystallizedDestinationId === prev.crystallizedDestinationId &&
    state.maxBudgetINR === prev.maxBudgetINR &&
    state.sessionId === prev.sessionId;
  if (unchanged) return;

  const firstUserMessage = state.chatMessages.find((m) => m.sender === 'user')?.text || 'Trip discovery';

  saveSession({
    sessionId: state.sessionId,
    createdAt: state.sessionCreatedAt,
    expiresAt: state.sessionExpiresAt,
    title: firstUserMessage.slice(0, 40) + (firstUserMessage.length > 40 ? '…' : ''),
    moodText: state.moodText,
    selectedTileIds: state.selectedTileIds,
    constraints: state.constraints,
    chatMessages: state.chatMessages,
    savedDestinations: state.savedDestinations,
    dismissedDestinationIds: state.dismissedDestinationIds,
    likedDestinationIds: state.likedDestinationIds,
    dismissedCategoryCounts: state.dismissedCategoryCounts,
    crystallizedDestinationId: state.crystallizedDestinationId,
    hasReflectedStyle: state.hasReflectedStyle,
    lastLearningAckAtMessageCount: state.lastLearningAckAtMessageCount,
    maxBudgetINR: state.maxBudgetINR,
  });
});
