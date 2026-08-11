/**
 * Seeds the Layer 1 knowledge base — build order step 3.
 *
 *   npm run db:seed              apply
 *   npm run db:seed -- --dry     generate + validate + report, write nothing
 *
 * Destinations come from the curated frontend KB (src/lib/indiaDestinations.ts),
 * which stays the single source of truth. transit_routes are GENERATED from the
 * shipped origin×zone tier matrix — every row lands with is_estimate = true, and
 * the plausibility gate below runs before anything is written.
 */
import { Client } from 'pg';
import { config } from 'dotenv';
import { INDIA_DESTINATIONS } from '../src/lib/indiaDestinations';
import { deriveDestinationCategories } from '../src/lib/travelContext';
import { ORIGIN_CITIES, getEffectiveTransitTier, estimateTransitCostINR } from '../src/lib/transitMatrix';
import type { BudgetTier, Destination, OriginCity } from '../src/types';

config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry');
const TODAY = new Date().toISOString().slice(0, 10);

// ── State ────────────────────────────────────────────────────────────────────
// `region` is a display string ("Konkan Coast, West India"), not an administrative
// one, so splitting on the comma yields "Konkan Coast" for Goa — not a state.
// An explicit map is auditable; a clever derivation would be silently wrong once.
const STATE_BY_ID: Record<string, string> = {
  jaipur_rajasthan: 'Rajasthan',
  udaipur_rajasthan: 'Rajasthan',
  jaisalmer_rajasthan: 'Rajasthan',
  ranthambore_rajasthan: 'Rajasthan',
  goa_beaches: 'Goa',
  alleppey_kerala: 'Kerala',
  munnar_kerala: 'Kerala',
  varanasi_up: 'Uttar Pradesh',
  agra_up: 'Uttar Pradesh',
  rishikesh_uk: 'Uttarakhand',
  leh_ladakh: 'Ladakh',
  manali_hp: 'Himachal Pradesh',
  spiti_valley_hp: 'Himachal Pradesh',
  darjeeling_wb: 'West Bengal',
  kolkata_wb: 'West Bengal',
  gangtok_sikkim: 'Sikkim',
  hampi_karnataka: 'Karnataka',
  coorg_karnataka: 'Karnataka',
  havelock_andaman: 'Andaman & Nicobar Islands',
  pondicherry: 'Puducherry',
  amritsar_punjab: 'Punjab',
  meghalaya_cherrapunji: 'Meghalaya',
  rann_of_kutch: 'Gujarat',
  mumbai_maharashtra: 'Maharashtra',
  srinagar_kashmir: 'Jammu & Kashmir',
};

// TC-NFR-805: served when the model times out or returns zero selections.
// Broad-appeal, all-rounder destinations spanning four different zones, so the
// fallback never shows four variations of the same trip.
const FALLBACK_RANK: Record<string, number> = {
  goa_beaches: 1,
  jaipur_rajasthan: 2,
  munnar_kerala: 3,
  rishikesh_uk: 4,
};

// No usable railhead: two are high-altitude road-only, one is an island.
const NO_RAIL = new Set(['leh_ladakh', 'spiti_valley_hp', 'havelock_andaman']);

const slug = (city: OriginCity) => city.toLowerCase().replace(/\s+/g, '_');
const round100 = (n: number) => Math.round(n / 100) * 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Tier already encodes how far/awkward a zone is from a given origin, so it is
// the honest basis for stretching door-to-door time rather than inventing a
// second distance model that could disagree with the fare tiers.
//
// This works for flights BECAUSE domestic flights are all 1.5–4h — tier captures
// essentially all the variation. It does NOT work for rail: train time tracks
// distance, and a fare tier cannot tell Delhi→Agra (2h) from Chennai→Agra (30h).
// Scaling rail by tier produced exactly that error, which is why rail gets its
// own table below rather than a multiplier.
// One-way door-to-door FLIGHT hours, origin metro → zone, including airport time
// and any onward surface leg. A tier multiplier over transitHours cannot express
// this: Leh's curated 1.5h is measured from Delhi, so scaling it by 1.6 claimed
// Chennai→Leh was a 2.4h trip when it is a connecting itinerary of 8h+.
const FLIGHT_HOURS: Record<string, Record<string, number>> = {
  delhi_ncr: { 'Himalayan North': 3.5, 'North & Central Plains': 3, 'West Coast': 5, 'South Peninsula': 6, 'East & Foothills': 5, Northeast: 6.5, 'Andaman Islands': 9 },
  mumbai: { 'Himalayan North': 6.5, 'North & Central Plains': 4.5, 'West Coast': 3, 'South Peninsula': 5, 'East & Foothills': 6.5, Northeast: 8.5, 'Andaman Islands': 9.5 },
  bengaluru: { 'Himalayan North': 8, 'North & Central Plains': 5.5, 'West Coast': 3.5, 'South Peninsula': 3, 'East & Foothills': 6, Northeast: 8.5, 'Andaman Islands': 7.5 },
  chennai: { 'Himalayan North': 8.5, 'North & Central Plains': 5.5, 'West Coast': 4.5, 'South Peninsula': 3, 'East & Foothills': 5.5, Northeast: 8, 'Andaman Islands': 6 },
  kolkata: { 'Himalayan North': 6.5, 'North & Central Plains': 4.5, 'West Coast': 5.5, 'South Peninsula': 5.5, 'East & Foothills': 3.5, Northeast: 4, 'Andaman Islands': 7 },
  hyderabad: { 'Himalayan North': 7, 'North & Central Plains': 4.5, 'West Coast': 4, 'South Peninsula': 3.5, 'East & Foothills': 6, Northeast: 8, 'Andaman Islands': 8 },
  pune: { 'Himalayan North': 7, 'North & Central Plains': 4.5, 'West Coast': 3, 'South Peninsula': 4.5, 'East & Foothills': 7, Northeast: 8.5, 'Andaman Islands': 9.5 },
  ahmedabad: { 'Himalayan North': 5.5, 'North & Central Plains': 3.5, 'West Coast': 3, 'South Peninsula': 6, 'East & Foothills': 7, Northeast: 9, 'Andaman Islands': 10.5 },
};

// Road hours track rail closely in India — same corridors, similar geography.
const ROAD_FACTOR = 0.9;

// Bounds on the within-zone stretch. Wide enough to separate Agra from Varanasi,
// tight enough that a metro's convenient airport can't collapse a cross-country
// journey into a short hop.
const clampFactor = (f: number) => clamp(f, 0.8, 1.4);

// One-way sleeper-train hours, origin metro → zone railhead (Kalka/Haridwar/Jammu
// for the Himalaya, NJP for the eastern foothills, Guwahati for the Northeast).
// The Andamans have no rail at all. Estimates, flagged is_estimate on every row.
const RAIL_HOURS: Record<string, Record<string, number>> = {
  delhi_ncr: { 'Himalayan North': 11, 'North & Central Plains': 6, 'West Coast': 20, 'South Peninsula': 34, 'East & Foothills': 20, Northeast: 36 },
  mumbai: { 'Himalayan North': 24, 'North & Central Plains': 16, 'West Coast': 8, 'South Peninsula': 22, 'East & Foothills': 32, Northeast: 50 },
  bengaluru: { 'Himalayan North': 42, 'North & Central Plains': 34, 'West Coast': 14, 'South Peninsula': 8, 'East & Foothills': 30, Northeast: 55 },
  chennai: { 'Himalayan North': 46, 'North & Central Plains': 32, 'West Coast': 22, 'South Peninsula': 7, 'East & Foothills': 28, Northeast: 52 },
  kolkata: { 'Himalayan North': 24, 'North & Central Plains': 20, 'West Coast': 32, 'South Peninsula': 30, 'East & Foothills': 10, Northeast: 18 },
  hyderabad: { 'Himalayan North': 32, 'North & Central Plains': 22, 'West Coast': 15, 'South Peninsula': 12, 'East & Foothills': 28, Northeast: 48 },
  pune: { 'Himalayan North': 28, 'North & Central Plains': 18, 'West Coast': 8, 'South Peninsula': 18, 'East & Foothills': 33, Northeast: 52 },
  ahmedabad: { 'Himalayan North': 20, 'North & Central Plains': 14, 'West Coast': 9, 'South Peninsula': 32, 'East & Foothills': 36, Northeast: 55 },
};

// A zone bundles destinations at very different distances — "North & Central
// Plains" holds both Agra (200km from Delhi) and Varanasi (800km). Each
// destination's own curated transitHours is the only within-zone proximity
// signal available, so rail time is scaled by how remote it is relative to its
// zone's median. Keeps Delhi→Agra short without making Delhi→Varanasi short too.
function zoneMedianTransitHours(zone: string, all: Destination[]): number {
  const hours = all.filter((d) => d.travelZone === zone).map((d) => d.quickStats.transitHours).sort((a, b) => a - b);
  return hours[Math.floor(hours.length / 2)];
}

/** Within-zone remoteness of this destination relative to its zone's median. */
function stretch(d: Destination, all: Destination[]): number {
  return clampFactor(d.quickStats.transitHours / zoneMedianTransitHours(d.travelZone, all));
}

function railHours(d: Destination, origin: OriginCity, all: Destination[]): number | null {
  const base = RAIL_HOURS[slug(origin)]?.[d.travelZone];
  if (base === undefined) return null; // Andaman Islands — no rail
  return round1(clamp(base * stretch(d, all), 2, 60));
}

function flightHours(d: Destination, origin: OriginCity, all: Destination[]): number {
  const base = FLIGHT_HOURS[slug(origin)][d.travelZone];
  return round1(clamp(base * stretch(d, all), 1.5, 14));
}

interface Route {
  origin_city_id: string;
  destination_id: string;
  mode: 'flight' | 'train' | 'bus' | 'self_drive';
  typical_cost_inr: number;
  duration_hours: number;
  notes: string;
}

function buildRoutes(d: Destination, origin: OriginCity, all: Destination[]): Route[] {
  const tier = getEffectiveTransitTier(d, origin);
  const base = estimateTransitCostINR(tier);

  // Nudge the tier's flat band by how remote this specific destination is, so
  // 400 rows aren't just four repeated numbers. Bounded so it can never cross
  // into the neighbouring tier's territory.
  const hourAdj = Math.round((d.quickStats.transitHours - 3) * 400);
  const cost = round100(clamp(base + hourAdj, base * 0.8, base * 1.35));
  const hours = flightHours(d, origin, all);

  const primary = d.quickStats.primaryMode;
  const routes: Route[] = [];
  // Trains and road trips are priced well below air fares — a rail-first
  // destination must not inherit the flight band just because it is the
  // primary way in. That made Delhi→Agra ₹4,600 by train.
  const railCost = round100(Math.max(cost * 0.45, 900));

  const roadLeg = primary === 'flight_plus_road' ? ` Includes the road transfer from ${d.quickStats.nearestAccess}.` : '';

  if (primary === 'rail') {
    routes.push({
      origin_city_id: slug(origin),
      destination_id: d.id,
      mode: 'train',
      typical_cost_inr: railCost,
      duration_hours: railHours(d, origin, all) ?? hours,
      notes: `Rail-first destination. Via ${d.quickStats.nearestAccess}.`,
    });
  } else if (primary === 'road') {
    const rh = railHours(d, origin, all);
    routes.push({
      origin_city_id: slug(origin),
      destination_id: d.id,
      mode: 'self_drive',
      typical_cost_inr: round100(Math.max(cost * 0.7, 1500)),
      duration_hours: rh === null ? hours : round1(clamp(rh * ROAD_FACTOR, 3, 48)),
      notes: `Road-only destination. Fuel and tolls for a round trip; no airport or railhead serves ${d.name}.`,
    });
  } else {
    routes.push({
      origin_city_id: slug(origin),
      destination_id: d.id,
      mode: 'flight',
      typical_cost_inr: cost,
      duration_hours: hours,
      notes: `Via ${d.quickStats.nearestAccess}.${roadLeg}`,
    });
  }

  // Budget alternative. Rail is genuinely slower and cheaper on Indian domestic
  // routes, which is the tradeoff the cost engine needs to be able to show.
  if (!NO_RAIL.has(d.id) && primary !== 'rail') {
    const rh = railHours(d, origin, all);
    if (rh !== null) {
      routes.push({
        origin_city_id: slug(origin),
        destination_id: d.id,
        mode: 'train',
        typical_cost_inr: round100(Math.max(cost * 0.38, 900)),
        duration_hours: rh,
        notes: 'Sleeper/3AC equivalent. Slower but materially cheaper than flying.',
      });
    }
  }

  return routes;
}

const routeTierOf = (d: Destination, r: Route): BudgetTier =>
  getEffectiveTransitTier(d, ORIGIN_CITIES.find((c) => slug(c) === r.origin_city_id)!);

async function main() {
  const destinations = INDIA_DESTINATIONS;

  // ── Generate ───────────────────────────────────────────────────────────────
  const routes: Route[] = [];
  for (const d of destinations) {
    for (const origin of ORIGIN_CITIES) routes.push(...buildRoutes(d, origin, destinations));
  }

  // ── Plausibility gate (runs before any write) ──────────────────────────────
  const problems: string[] = [];

  for (const d of destinations) {
    if (!STATE_BY_ID[d.id]) problems.push(`${d.id}: no state mapping`);
    if (d.whatToKnow.length < 2) problems.push(`${d.id}: whatToKnow has ${d.whatToKnow.length} entries, DB requires >= 2`);
    if (deriveDestinationCategories(d).length === 0) problems.push(`${d.id}: derives zero categories — invisible to negative filtering`);
  }

  for (const r of routes) {
    const d = destinations.find((x) => x.id === r.destination_id)!;
    if (r.typical_cost_inr <= 0) problems.push(`${r.destination_id}/${r.origin_city_id}: non-positive cost`);
    if (r.mode === 'flight' && (r.duration_hours > 14 || r.duration_hours < 1.5)) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: implausible flight duration ${r.duration_hours}h`);
    }
    if (r.mode === 'self_drive' && (r.duration_hours < 3 || r.duration_hours > 48)) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: implausible drive ${r.duration_hours}h`);
    }
    // A cross-country flight is never a short hop, whatever the destination's
    // own door-to-door figure says — this is the Chennai→Leh 2.4h class of bug.
    if (r.mode === 'flight' && (routeTierOf(d, r) === '₹₹₹' || routeTierOf(d, r) === '₹₹₹₹') && r.duration_hours < 4) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: ${r.duration_hours}h flight into a far zone — too short`);
    }
    // Rail must always be the slow option; if it isn't, the two models disagree.
    const flightRow = routes.find((x) => x.origin_city_id === r.origin_city_id && x.destination_id === r.destination_id && x.mode === 'flight');
    if (r.mode === 'train' && flightRow && r.duration_hours <= flightRow.duration_hours) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: train (${r.duration_hours}h) not slower than flying (${flightRow.duration_hours}h)`);
    }
    if (r.mode === 'train' && flightRow && r.typical_cost_inr >= flightRow.typical_cost_inr) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: train not cheaper than flying`);
    }
    if (r.mode === 'train' && (r.duration_hours < 2 || r.duration_hours > 60)) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: implausible train duration ${r.duration_hours}h`);
    }
    // The bug this catches: scaling rail time by fare tier made Chennai→Agra look
    // like Delhi→Agra. A cross-country rail journey cannot be a short hop, so any
    // train into a ₹₹₹/₹₹₹₹ zone must actually be long.
    const routeTier = routeTierOf(d, r);
    if (r.mode === 'train' && (routeTier === '₹₹₹' || routeTier === '₹₹₹₹') && r.duration_hours < 18) {
      problems.push(`${r.destination_id}/${r.origin_city_id}: ${r.duration_hours}h train into a ${routeTier} zone — too short for the distance`);
    }
    if (d.travelZone === 'Andaman Islands' && r.mode !== 'flight') {
      problems.push(`${r.destination_id}/${r.origin_city_id}: ${r.mode} to an island`);
    }
  }

  const expectedPairs = destinations.length * ORIGIN_CITIES.length;
  const actualPairs = new Set(routes.map((r) => `${r.origin_city_id}|${r.destination_id}`)).size;
  if (actualPairs !== expectedPairs) problems.push(`covered ${actualPairs} origin×destination pairs, expected ${expectedPairs}`);

  console.log('Plausibility gate\n');
  console.log(`  destinations           ${destinations.length}`);
  console.log(`  origin cities          ${ORIGIN_CITIES.length}`);
  console.log(`  origin×dest pairs      ${actualPairs} / ${expectedPairs}`);
  console.log(`  transit routes         ${routes.length}`);
  console.log(`  problems               ${problems.length}`);
  if (problems.length) {
    console.log(`\n${problems.slice(0, 25).map((p) => `  - ${p}`).join('\n')}`);
    console.log('\nAborted — nothing written.');
    process.exit(1);
  }

  // ── Spot-check sample ──────────────────────────────────────────────────────
  const SAMPLE: Array<[OriginCity, string]> = [
    ['Delhi NCR', 'goa_beaches'],
    ['Mumbai', 'spiti_valley_hp'],
    ['Bengaluru', 'havelock_andaman'],
    ['Delhi NCR', 'agra_up'],
    ['Chennai', 'leh_ladakh'],
    ['Kolkata', 'gangtok_sikkim'],
    ['Mumbai', 'goa_beaches'],
    ['Delhi NCR', 'srinagar_kashmir'],
  ];
  console.log('\nSample fares for spot-check  (cost = ROUND TRIP pp, hours = one way)\n');
  console.log(`  ${'origin'.padEnd(11)} ${'destination'.padEnd(22)} ${'mode'.padEnd(11)} ${'cost'.padStart(8)}  hours`);
  for (const [origin, destId] of SAMPLE) {
    for (const r of routes.filter((x) => x.origin_city_id === slug(origin) && x.destination_id === destId)) {
      const money = `₹${r.typical_cost_inr.toLocaleString('en-IN')}`;
      console.log(`  ${origin.padEnd(11)} ${destId.padEnd(22)} ${r.mode.padEnd(11)} ${money.padStart(8)}  ${r.duration_hours}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n--dry: validated only, nothing written.');
    return;
  }

  // ── Write ──────────────────────────────────────────────────────────────────
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query('begin');

    for (const city of ORIGIN_CITIES) {
      await client.query(
        `insert into origin_cities (id, label) values ($1, $2)
         on conflict (id) do update set label = excluded.label`,
        [slug(city), city]
      );
    }

    for (const d of destinations) {
      await client.query(
        `insert into destinations (
           id, name, country, state, region, tagline, hero_image_url, gallery_urls,
           vibe_tags, categories, travel_zone, best_months, temp_range_c,
           seasonality_notes, best_time, avg_daily_cost_inr, ground_cost_tier,
           transit_cost_tier, transit_hours, primary_mode, nearest_access,
           overview_summary, best_for_tags, why_love_it, what_to_know,
           experience_highlights, hidden_fees, last_verified_date, is_uncertain,
           uncertainty_notes, fallback_rank
         ) values (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
           $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
         )
         on conflict (id) do update set
           name = excluded.name, state = excluded.state, region = excluded.region,
           tagline = excluded.tagline, hero_image_url = excluded.hero_image_url,
           gallery_urls = excluded.gallery_urls, vibe_tags = excluded.vibe_tags,
           categories = excluded.categories, travel_zone = excluded.travel_zone,
           best_months = excluded.best_months, temp_range_c = excluded.temp_range_c,
           seasonality_notes = excluded.seasonality_notes, best_time = excluded.best_time,
           avg_daily_cost_inr = excluded.avg_daily_cost_inr,
           ground_cost_tier = excluded.ground_cost_tier,
           transit_cost_tier = excluded.transit_cost_tier,
           transit_hours = excluded.transit_hours, primary_mode = excluded.primary_mode,
           nearest_access = excluded.nearest_access,
           overview_summary = excluded.overview_summary,
           best_for_tags = excluded.best_for_tags, why_love_it = excluded.why_love_it,
           what_to_know = excluded.what_to_know,
           experience_highlights = excluded.experience_highlights,
           hidden_fees = excluded.hidden_fees,
           last_verified_date = excluded.last_verified_date,
           is_uncertain = excluded.is_uncertain,
           uncertainty_notes = excluded.uncertainty_notes,
           fallback_rank = excluded.fallback_rank`,
        [
          d.id,
          d.name,
          d.country,
          STATE_BY_ID[d.id],
          d.region,
          d.tagline,
          d.heroImageUrl,
          d.galleryUrls,
          d.vibeTags,
          deriveDestinationCategories(d),
          d.travelZone,
          d.weather.bestMonths,
          d.weather.tempRangeC,
          d.weather.seasonalityNotes,
          d.quickStats.bestTime,
          d.quickStats.avgDailyCostINR,
          d.quickStats.groundCostTier,
          d.quickStats.transitCostTier,
          d.quickStats.transitHours,
          d.quickStats.primaryMode,
          d.quickStats.nearestAccess,
          d.overviewSummary,
          d.bestForTags,
          d.whyYouWillLoveIt,
          d.whatToKnow,
          JSON.stringify(d.experienceHighlights),
          JSON.stringify(d.hiddenFees),
          d.lastVerifiedDate,
          d.isUncertain ?? false,
          d.uncertaintyNotes ?? null,
          FALLBACK_RANK[d.id] ?? null,
        ]
      );
    }

    for (const r of routes) {
      await client.query(
        `insert into transit_routes (
           origin_city_id, destination_id, mode, typical_cost_inr,
           duration_hours, notes, is_estimate, last_verified_date
         ) values ($1,$2,$3,$4,$5,$6,true,$7)
         on conflict (origin_city_id, destination_id, mode) do update set
           typical_cost_inr = excluded.typical_cost_inr,
           duration_hours = excluded.duration_hours,
           notes = excluded.notes,
           last_verified_date = excluded.last_verified_date`,
        [r.origin_city_id, r.destination_id, r.mode, r.typical_cost_inr, r.duration_hours, r.notes, TODAY]
      );
    }

    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    await client.end();
    throw err;
  }

  const counts = await client.query<{ t: string; n: string }>(
    `select 'destinations' as t, count(*)::text as n from destinations
     union all select 'origin_cities', count(*)::text from origin_cities
     union all select 'transit_routes', count(*)::text from transit_routes
     order by t`
  );
  console.log('\nWritten\n');
  for (const row of counts.rows) console.log(`  ${row.t.padEnd(16)} ${row.n}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
