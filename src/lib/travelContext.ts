import { Destination, DestinationCategory, TravelMode, TravelStyle } from '@/types';

// Epic 3: Traveler Context Capture. These are mock-scoped heuristics standing in for the
// real NLP layer — deliberately conservative, since FR-3.1.5 requires passive inference and
// NFR-3.1.3 forbids guessing a context without conversational evidence.

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  solo: 'Solo',
  couple: 'Couple',
  friends: 'Friends Group',
  family_young_kids: 'Family (Young Kids)',
  family_teens: 'Family (Teens)',
  digital_nomad: 'Digital Nomad',
};

// Phrasing used when the AI acknowledges the context in chat.
export const TRAVEL_MODE_PHRASES: Record<TravelMode, string> = {
  solo: 'traveling solo',
  couple: 'traveling as a couple',
  friends: 'traveling with friends',
  family_young_kids: 'traveling as a family with young kids',
  family_teens: 'traveling as a family with teens',
  digital_nomad: 'working remotely while you travel',
};

// FR-3.1.2: what each mode actually changes about the recommendations, surfaced so the
// effect of a detected context is visible rather than silent.
export const TRAVEL_MODE_FOCUS: Record<TravelMode, string> = {
  solo: 'walkability, social hostels, and solo-safe neighbourhoods',
  couple: 'romantic dinners, quiet stays, and slower shared days',
  friends: 'group-friendly stays, nightlife, and shared activities',
  family_young_kids: 'stroller access, short transfers, and low-stress logistics',
  family_teens: 'activities that hold teen attention and flexible evenings',
  digital_nomad: 'WiFi reliability, cafés to work from, and longer-stay value',
};

/**
 * FR-3.1.3: detects an explicit correction that REMOVES kids from the trip
 * (e.g. "the kids aren't coming this time"), so a prior family inference can be undone.
 */
function detectsKidsRemoval(text: string): boolean {
  return /\b(kids?|children|toddlers?|teens?|teenagers?)\b[^.!?]{0,24}\b(are|aren'?t|are\s+not|not)\s*(coming|joining|with\s+us)?\b/i.test(
    text
  ) || /\b(no|without|minus)\s+(the\s+)?(kids?|children|toddlers?)\b/i.test(text);
}

/**
 * Passive context inference from a single message. Returns null when there is no clear
 * signal — callers keep the previously detected mode rather than defaulting to something.
 *
 * Order matters: a correction that drops the kids is checked before the family patterns,
 * otherwise "the kids aren't coming, just my wife and me" would re-detect as family.
 */
export function detectContextFromText(text: string): TravelMode | null {
  const t = text.toLowerCase();

  const mentionsPartner = /\b(partner|spouse|husband|wife|boyfriend|girlfriend|honeymoon|anniversary|just\s+(the\s+)?two\s+of\s+us)\b/.test(t);

  // FR-3.1.3: explicit removal of kids re-resolves the mode from what's left in the sentence.
  if (detectsKidsRemoval(t)) {
    if (mentionsPartner) return 'couple';
    if (/\b(friends?|buddies)\b/.test(t)) return 'friends';
    return 'solo';
  }

  if (/\b(working remotely|remote work|digital nomad|workation|work(ing)? from|laptop)\b/.test(t)) return 'digital_nomad';
  if (/\b(toddlers?|stroller|pram|baby|infant|young kids?|little ones?|3[- ]year[- ]old|4[- ]year[- ]old)\b/.test(t)) return 'family_young_kids';
  if (/\b(teens?|teenagers?)\b/.test(t)) return 'family_teens';
  if (/\b(kids?|children)\b/.test(t)) return 'family_young_kids';
  if (mentionsPartner) return 'couple';
  if (/\b(friends?|buddies|girls trip|guys trip|group trip)\b/.test(t)) return 'friends';
  if (/\b(solo|by myself|on my own|just me|alone)\b/.test(t)) return 'solo';

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FR-3.3.2: implicit negative learning by category
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<DestinationCategory, RegExp> = {
  beach_resort: /\b(beach|coastal|coast|island|seaside|sun|resort|snorkel|sea)\b/i,
  mountain_nature: /\b(mountain|wild|nature|hik|trek|forest|jungle|alpine|valley|desert|safari|waterfall)\b/i,
  city_urban: /\b(urban|city|nightlife|metropol|architecture|street art)\b/i,
  culinary_wine: /\b(culinary|wine|food|gastronom|cuisine|farm-to-table|street food)\b/i,
  cultural_historic: /\b(cultur|histor|heritage|temple|ancient|ruins|spiritual|monument|palace)\b/i,
  wellness_slow: /\b(wellness|slow|unplug|retreat|thermal|spa|yoga|quiet|serene|tranquil)\b/i,
};

export const CATEGORY_LABELS: Record<DestinationCategory, string> = {
  beach_resort: 'beach & resort spots',
  mountain_nature: 'mountain & wild nature spots',
  city_urban: 'big-city destinations',
  culinary_wine: 'food & wine destinations',
  cultural_historic: 'cultural & historic destinations',
  wellness_slow: 'wellness & slow-travel spots',
};

/**
 * Derives coarse categories for a destination from its vibe tags, tagline, and region.
 * Kept as a derivation rather than a stored field so the 50-destination KB doesn't need
 * a parallel taxonomy to maintain.
 */
export function deriveDestinationCategories(destination: Destination): DestinationCategory[] {
  const haystack = [
    ...destination.vibeTags,
    destination.tagline,
    destination.region,
    ...destination.bestForTags,
  ].join(' ');

  return (Object.keys(CATEGORY_KEYWORDS) as DestinationCategory[]).filter((category) =>
    CATEGORY_KEYWORDS[category].test(haystack)
  );
}

/**
 * NFR-3.3.3: a filter bubble check. If every remaining destination is ruled out, the caller
 * should tell the user their negatives are too restrictive rather than returning nothing.
 */
export function filterByNegatives(
  destinations: Destination[],
  blockedCategories: DestinationCategory[]
): Destination[] {
  if (blockedCategories.length === 0) return destinations;
  return destinations.filter((d) => {
    const cats = deriveDestinationCategories(d);
    return !cats.some((c) => blockedCategories.includes(c));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FR-3.2.1: travel style calibration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts style signals from one message. Returns only the dimensions this message
 * actually evidenced, so repeated calls can be merged without overwriting known values.
 */
export function detectStyleSignals(text: string): TravelStyle {
  const t = text.toLowerCase();
  const style: TravelStyle = {};

  if (/\b(hostel|backpack|cheap|budget|shoestring|street food|local bus|dorm)\b/.test(t)) {
    style.comfortTier = 'backpacker';
  } else if (/\b(luxur|five[- ]star|5[- ]star|splurge|premium|resort)\b/.test(t)) {
    style.comfortTier = 'luxury';
  } else if (/\b(boutique|design hotel|comfortable|nice hotel|curated)\b/.test(t)) {
    style.comfortTier = 'boutique';
  }

  if (/\b(hik|trek|adventure|climb|dive|surf|active|explore|off[- ]grid)\b/.test(t)) {
    style.adventureLevel = 'active';
  } else if (/\b(relax|unwind|unplug|chill|slow|rest|lounge|decompress)\b/.test(t)) {
    style.adventureLevel = 'relaxed';
  }

  if (/\b(food|eat|cuisine|culinary|restaurant|wine|beer|street food|market)\b/.test(t)) {
    style.foodFocus = true;
  }

  if (/\b(no crowds?|not touristy|tourist traps?|avoid crowds?|off the beaten|quiet|uncrowded|hidden)\b/.test(t)) {
    style.crowdAversion = true;
  }

  if (/\b(packed|fast|see everything|lots to do)\b/.test(t)) {
    style.pace = 'fast';
  } else if (/\b(slow mornings?|slow travel|take it easy|leisurely)\b/.test(t)) {
    style.pace = 'chill';
  }

  return style;
}

/** Merges newly observed signals over the existing style — later evidence wins. */
export function mergeStyle(existing: TravelStyle | undefined, incoming: TravelStyle): TravelStyle {
  return { ...(existing || {}), ...incoming };
}

const COMFORT_PHRASES: Record<NonNullable<TravelStyle['comfortTier']>, string> = {
  backpacker: 'budget-friendly, backpacker-style stays',
  mid_range: 'comfortable mid-range stays',
  boutique: 'boutique, design-led stays',
  luxury: 'high-comfort, splurge-worthy stays',
};

const ADVENTURE_PHRASES: Record<NonNullable<TravelStyle['adventureLevel']>, string> = {
  relaxed: 'a relaxed, unwind-first pace',
  balanced: 'a balance of activity and downtime',
  active: 'active days with plenty to explore',
};

/**
 * FR-3.2.2: builds the reflect-back sentence. Returns null when there isn't enough
 * signal to say anything specific — a vague reflection reads worse than none.
 */
export function buildStyleSummary(style: TravelStyle): string | null {
  const parts: string[] = [];

  if (style.adventureLevel) parts.push(ADVENTURE_PHRASES[style.adventureLevel]);
  if (style.comfortTier) parts.push(COMFORT_PHRASES[style.comfortTier]);
  if (style.foodFocus) parts.push('food and drink close to the centre of the trip');
  if (style.crowdAversion) parts.push('places that skip the tourist crush');

  if (parts.length < 2) return null;

  const listed =
    parts.length === 2
      ? `${parts[0]} and ${parts[1]}`
      : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;

  return `I'm picking up that you're after ${listed} — am I reading you right?`;
}
