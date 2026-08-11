import { BudgetTier, Destination, OriginCity, TransitMode, TravelZone } from '@/types';

// Epic 7 (NFR-7.1.1): static India-domestic Transit Cost Matrix — origin metro → destination
// zone pricing tiers, stored in the curated KB. Deliberately NOT a live fare API: keeps latency
// low and avoids the hallucination/staleness risk of real-time pricing, per the PRD's Layer 2
// deferral. Domestic routes are also far more knowable than global cost-of-living, which is
// what makes the India-only scope a data-quality win rather than a compromise.
export const ORIGIN_CITIES: OriginCity[] = [
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
];

// Tiers are severity, not absolute fares: ₹ = short hop or good rail, ₹₹ = standard domestic
// flight, ₹₹₹ = long or route-limited, ₹₹₹₹ = remote/island premium.
const TRANSIT_MATRIX: Record<OriginCity, Record<TravelZone, BudgetTier>> = {
  'Delhi NCR': {
    'Himalayan North': '₹',
    'North & Central Plains': '₹',
    'West Coast': '₹₹',
    'South Peninsula': '₹₹₹',
    'East & Foothills': '₹₹',
    Northeast: '₹₹₹',
    'Andaman Islands': '₹₹₹₹',
  },
  Mumbai: {
    'Himalayan North': '₹₹₹',
    'North & Central Plains': '₹₹',
    'West Coast': '₹',
    'South Peninsula': '₹₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹₹₹',
  },
  Bengaluru: {
    'Himalayan North': '₹₹₹',
    'North & Central Plains': '₹₹₹',
    'West Coast': '₹',
    'South Peninsula': '₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹₹',
  },
  Chennai: {
    'Himalayan North': '₹₹₹₹',
    'North & Central Plains': '₹₹₹',
    'West Coast': '₹₹',
    'South Peninsula': '₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹',
  },
  Kolkata: {
    'Himalayan North': '₹₹₹',
    'North & Central Plains': '₹₹',
    'West Coast': '₹₹₹',
    'South Peninsula': '₹₹₹',
    'East & Foothills': '₹',
    Northeast: '₹',
    'Andaman Islands': '₹₹₹',
  },
  Hyderabad: {
    'Himalayan North': '₹₹₹',
    'North & Central Plains': '₹₹',
    'West Coast': '₹₹',
    'South Peninsula': '₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹₹',
  },
  Pune: {
    'Himalayan North': '₹₹₹',
    'North & Central Plains': '₹₹',
    'West Coast': '₹',
    'South Peninsula': '₹₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹₹₹',
  },
  Ahmedabad: {
    'Himalayan North': '₹₹',
    'North & Central Plains': '₹₹',
    'West Coast': '₹',
    'South Peninsula': '₹₹₹',
    'East & Foothills': '₹₹₹',
    Northeast: '₹₹₹₹',
    'Andaman Islands': '₹₹₹₹',
  },
};

const MODE_LABELS: Record<TransitMode, string> = {
  flight: '✈️ Flight',
  flight_plus_road: '✈️ Flight + road transfer',
  rail: '🚆 Train',
  road: '🚗 Road',
};

export function describeTransitMode(mode: TransitMode): string {
  return MODE_LABELS[mode];
}

/**
 * Origin-aware transit tier. Falls back to the destination's stored tier when no origin
 * city is set — keeps origin capture fully optional (DP-3).
 */
export function getEffectiveTransitTier(destination: Destination, originCity?: OriginCity | null): BudgetTier {
  if (!originCity) return destination.quickStats.transitCostTier;
  return TRANSIT_MATRIX[originCity][destination.travelZone];
}

/**
 * Round-trip transit estimate in INR, per person, at typical (non-peak) domestic fares.
 *
 * ₹     short hop or a good overnight train
 * ₹₹    standard domestic return flight
 * ₹₹₹   long or route-limited (Leh, Srinagar, the Northeast)
 * ₹₹₹₹  remote/island premium (Andamans)
 */
export function estimateTransitCostINR(tier: BudgetTier): number {
  return tier === '₹₹₹₹' ? 24000 : tier === '₹₹₹' ? 15000 : tier === '₹₹' ? 9000 : 5000;
}

/** Indian digit grouping (₹1,20,000 — not ₹120,000). Wrong grouping reads as foreign. */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
