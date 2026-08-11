import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Destination } from '@/types';

/**
 * The Layer 1 catalogue, read from Postgres and cached for the process lifetime.
 *
 * Cached because the enum in the tool schema and the catalogue text in the system
 * prompt must be byte-identical across requests — they sit at the front of the
 * prompt prefix, and any variation invalidates DeepSeek's automatic context cache
 * on every turn (§4.4). A per-request read would also reorder rows.
 */

interface DestinationRow {
  id: string;
  name: string;
  country: string;
  state: string;
  region: string;
  tagline: string;
  hero_image_url: string;
  gallery_urls: string[];
  vibe_tags: string[];
  categories: string[];
  travel_zone: string;
  best_months: string[];
  temp_range_c: string;
  seasonality_notes: string;
  best_time: string;
  avg_daily_cost_inr: number;
  ground_cost_tier: string;
  transit_cost_tier: string;
  transit_hours: number;
  primary_mode: string;
  nearest_access: string;
  overview_summary: string;
  best_for_tags: string[];
  why_love_it: string[];
  what_to_know: string[];
  experience_highlights: unknown;
  hidden_fees: unknown;
  last_verified_date: string;
  is_uncertain: boolean;
  uncertainty_notes: string | null;
  fallback_rank: number | null;
}

export interface Catalogue {
  ids: string[];
  categorySlugs: string[];
  byId: Map<string, Destination>;
  promptText: string;
  fallbackIds: string[];
}

let cached: Catalogue | null = null;

/** `matchScore`/`matchRationale`/`curiosityHook` are per-turn model output, not KB
 *  facts, so they are placeholders here and filled in when a turn selects the row. */
function rowToDestination(r: DestinationRow): Destination {
  return {
    id: r.id,
    name: r.name,
    country: r.country,
    region: r.region,
    tagline: r.tagline,
    heroImageUrl: r.hero_image_url,
    galleryUrls: r.gallery_urls,
    vibeTags: r.vibe_tags,
    matchScore: 0,
    matchRationale: '',
    curiosityHook: '',
    overviewSummary: r.overview_summary,
    travelZone: r.travel_zone as Destination['travelZone'],
    quickStats: {
      bestTime: r.best_time,
      avgDailyCostINR: r.avg_daily_cost_inr,
      transitHours: Number(r.transit_hours),
      primaryMode: r.primary_mode as Destination['quickStats']['primaryMode'],
      nearestAccess: r.nearest_access,
      transitCostTier: r.transit_cost_tier as Destination['quickStats']['transitCostTier'],
      groundCostTier: r.ground_cost_tier as Destination['quickStats']['groundCostTier'],
    },
    weather: {
      bestMonths: r.best_months,
      tempRangeC: r.temp_range_c,
      seasonalityNotes: r.seasonality_notes,
    },
    bestForTags: r.best_for_tags,
    whyYouWillLoveIt: r.why_love_it,
    whatToKnow: r.what_to_know,
    experienceHighlights: (r.experience_highlights ?? []) as Destination['experienceHighlights'],
    hiddenFees: (r.hidden_fees ?? []) as Destination['hiddenFees'],
    lastVerifiedDate: r.last_verified_date,
    isUncertain: r.is_uncertain,
    uncertaintyNotes: r.uncertainty_notes ?? undefined,
  };
}

/**
 * ~5K tokens for 25 destinations, so the whole catalogue goes in the prompt and
 * there is no retrieval step to miss (§10). Cost figures and hidden fees are
 * deliberately omitted: the model selects and explains, and every number the user
 * sees is joined from Postgres afterwards, so putting them here would only create
 * an opportunity for the model to misquote them.
 */
function buildPromptText(destinations: Destination[]): string {
  return destinations
    .map((d) =>
      [
        `## ${d.id}`,
        `${d.name} — ${d.region}`,
        `Tagline: ${d.tagline}`,
        `Vibe: ${d.vibeTags.join(', ')}`,
        `Best for: ${d.bestForTags.join(', ')}`,
        `Best time: ${d.quickStats.bestTime}`,
        `Getting there: ${d.quickStats.primaryMode.replace(/_/g, ' ')} via ${d.quickStats.nearestAccess}`,
        `Summary: ${d.overviewSummary}`,
        `Honest drawbacks: ${d.whatToKnow.join(' | ')}`,
      ].join('\n')
    )
    .join('\n\n');
}

export async function getCatalogue(): Promise<Catalogue> {
  if (cached) return cached;

  const { data, error } = await supabaseAdmin()
    .from('destinations')
    .select('*')
    // Stable order so the cached prompt prefix is byte-identical every time.
    .order('id', { ascending: true });

  if (error) throw new Error(`Failed to load catalogue: ${error.message}`);
  if (!data?.length) throw new Error('Catalogue is empty — run `npm run db:seed`.');

  const rows = data as DestinationRow[];
  const destinations = rows.map(rowToDestination);

  cached = {
    ids: destinations.map((d) => d.id),
    categorySlugs: Array.from(new Set(rows.flatMap((r) => r.categories))).sort(),
    byId: new Map(destinations.map((d) => [d.id, d])),
    promptText: buildPromptText(destinations),
    fallbackIds: rows
      .filter((r) => r.fallback_rank !== null)
      .sort((a, b) => (a.fallback_rank ?? 0) - (b.fallback_rank ?? 0))
      .map((r) => r.id),
  };

  return cached;
}
