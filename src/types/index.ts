// FR-3.1.4: the six context modes the system must support. `family_young_kids` and
// `family_teens` stay distinct because the logistics differ sharply (strollers vs. late nights).
export type TravelMode =
  | 'solo'
  | 'couple'
  | 'friends'
  | 'family_young_kids'
  | 'family_teens'
  | 'digital_nomad';

// FR-3.2.1: the style dimensions inferred from conversation and reflected back to the user.
export interface TravelStyle {
  comfortTier?: 'backpacker' | 'mid_range' | 'boutique' | 'luxury';
  adventureLevel?: 'relaxed' | 'balanced' | 'active';
  foodFocus?: boolean;
  crowdAversion?: boolean;
  pace?: 'chill' | 'balanced' | 'fast';
}

// V1 is India-domestic and INR-denominated throughout — see docs/backend_plan_wandr_v1.md §9.
// The tier glyphs are rupees so the severity scale reads in the same currency as every figure
// beside it; mixing a `$` tier next to a `₹` amount is exactly the kind of detail that erodes
// trust in the cost engine.
export type BudgetTier = '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹';

// Epic 7 (NFR-7.1.1): the V1 knowledge base is India-domestic, so origins are Indian metros
// rather than global regions. A traveller flying Delhi→Goa is a 2.5h domestic hop, not a
// 17h intercontinental one — the earlier global model made every Indian destination look
// unreachable because its numbers were written from a North American origin.
export type OriginCity =
  | 'Delhi NCR'
  | 'Mumbai'
  | 'Bengaluru'
  | 'Chennai'
  | 'Kolkata'
  | 'Hyderabad'
  | 'Pune'
  | 'Ahmedabad';

// Destination-side half of the transit matrix. Grouped by how transit cost actually behaves
// from the origins above, not by administrative geography.
export type TravelZone =
  | 'Himalayan North'
  | 'North & Central Plains'
  | 'West Coast'
  | 'South Peninsula'
  | 'East & Foothills'
  | 'Northeast'
  | 'Andaman Islands';

// Domestic India is genuinely multi-modal — several destinations have no usable airport,
// so "flight time" alone can't describe how you get there.
export type TransitMode = 'flight' | 'flight_plus_road' | 'rail' | 'road';

// FR-3.3.2: coarse buckets used for implicit negative learning ("2 beach dismissals → stop
// suggesting beaches"). Derived from vibe tags rather than stored per-destination, so the
// curated KB stays the single source of truth.
export type DestinationCategory =
  | 'beach_resort'
  | 'mountain_nature'
  | 'city_urban'
  | 'culinary_wine'
  | 'cultural_historic'
  | 'wellness_slow';

export interface QuickStats {
  bestTime: string;
  /** Mid-range per-person daily ground spend, in INR. */
  avgDailyCostINR: number;
  /** Typical door-to-door transit time from a major Indian metro, including any surface leg. */
  transitHours: number;
  primaryMode: TransitMode;
  /** The airport or railhead that actually serves this destination — explains `transitHours`. */
  nearestAccess: string;
  transitCostTier: BudgetTier;
  groundCostTier: BudgetTier;
}

export interface WeatherInfo {
  bestMonths: string[];
  tempRangeC: string;
  seasonalityNotes: string;
}

export interface ExperienceHighlight {
  id: string;
  title: string;
  description: string;
  category: 'Food' | 'Nature' | 'Culture' | 'Adventure';
  matchRationale?: string;
  imageUrl?: string;
}

export interface HiddenFeeAlert {
  title: string;
  amount: string;
  description: string;
  isMandatory: boolean;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  tagline: string;
  heroImageUrl: string;
  galleryUrls: string[];
  vibeTags: string[];
  matchScore: number;
  matchRationale: string;
  curiosityHook: string;
  overviewSummary: string;
  quickStats: QuickStats;
  travelZone: TravelZone; // for origin-aware transit tier lookups, distinct from the display-only `region` string
  weather: WeatherInfo;
  bestForTags: string[];
  whyYouWillLoveIt: string[];
  whatToKnow: string[]; // Honest drawbacks — min 2 points
  experienceHighlights: ExperienceHighlight[];
  hiddenFees: HiddenFeeAlert[];
  lastVerifiedDate: string; // ISO date string e.g. "2026-01-15"
  isUncertain?: boolean;
  uncertaintyNotes?: string;
}

export interface MoodTile {
  id: string;
  emoji: string;
  label: string;
  tagline: string;
  category: string;
  bgGradient: string;
}

export interface UserConstraints {
  datesFlexibility?: 'exact' | 'flexible_month' | 'surprise';
  travelMonth?: string;
  durationDays?: number;
  maxBudgetINR?: number;
  travelPace?: 'chill' | 'balanced' | 'fast';
  selectedCheckboxVibes?: string[];
  originCity?: OriginCity;
  travelMode?: TravelMode;
  travelStyle?: TravelStyle;
  explicitNegatives?: string[];
  implicitNegatives?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  destinations?: Destination[];
  followUpQuestions?: string[];
  isStreaming?: boolean;
  uncertaintyFlag?: boolean;
  // FR-3.2.2: renders the one-per-session travel-style reflection card the user confirms or tweaks.
  styleReflection?: string;
}

// FR-5.3.1/5.3.2: the full snapshot restored when a user returns to their session URL.
export interface PersistedSession {
  sessionId: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO — createdAt + 48h (FR-5.3.4)
  title: string;
  moodText: string;
  selectedTileIds: string[];
  constraints: UserConstraints;
  chatMessages: ChatMessage[];
  savedDestinations: Destination[];
  dismissedDestinationIds: string[];
  likedDestinationIds: string[];
  dismissedCategoryCounts: Record<string, number>;
  crystallizedDestinationId: string | null;
  hasReflectedStyle: boolean;
  lastLearningAckAtMessageCount: number;
  maxBudgetINR: number;
}
