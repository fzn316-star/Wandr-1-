/**
 * Seed review — surfaces what was written and where the estimates are weakest.
 *
 *   npx tsx scripts/review-seed.ts
 *
 * Every transit_routes row is generated (is_estimate = true). This prints the
 * extremes and the thinnest categories, which is where a wrong number is both
 * most likely and most obvious to a human who knows the routes.
 */
import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const section = (title: string) => console.log(`\n${title}\n`);

  const { rows: counts } = await c.query(
    `select
       (select count(*) from destinations)   as destinations,
       (select count(*) from origin_cities)  as origins,
       (select count(*) from transit_routes) as routes,
       (select count(*) from transit_routes where is_estimate) as estimates,
       (select count(*) from destinations where fallback_rank is not null) as fallbacks`
  );
  section('Seeded');
  const t = counts[0];
  console.log(`  destinations ${t.destinations}   origins ${t.origins}   routes ${t.routes}`);
  console.log(`  estimates ${t.estimates}/${t.routes}   fallback cards ${t.fallbacks}`);

  // FR-3.3.2 depends on these: a category with only 1–2 destinations hits the
  // filter-bubble message after a couple of dismissals (open risk in §9).
  const { rows: cats } = await c.query<{ category: string; n: string }>(
    `select unnest(categories) as category, count(*)::text as n
     from destinations group by 1 order by count(*) desc`
  );
  section('Category coverage (thin ones bubble early — plan §9)');
  for (const r of cats) {
    const flag = Number(r.n) <= 2 ? '  <-- thin' : '';
    console.log(`  ${r.category.padEnd(20)} ${String(r.n).padStart(2)}${flag}`);
  }

  const { rows: modes } = await c.query<{ mode: string; n: string; lo: string; hi: string }>(
    `select mode, count(*)::text as n, min(duration_hours)::text as lo, max(duration_hours)::text as hi
     from transit_routes group by 1 order by count(*) desc`
  );
  section('Routes by mode (one-way hours)');
  for (const r of modes) console.log(`  ${r.mode.padEnd(12)} ${String(r.n).padStart(3)}   ${r.lo}h – ${r.hi}h`);

  const { rows: extremes } = await c.query(
    `(select 'priciest' as k, origin_city_id, destination_id, mode, typical_cost_inr, duration_hours
      from transit_routes order by typical_cost_inr desc limit 3)
     union all
     (select 'cheapest', origin_city_id, destination_id, mode, typical_cost_inr, duration_hours
      from transit_routes order by typical_cost_inr asc limit 3)
     union all
     (select 'longest', origin_city_id, destination_id, mode, typical_cost_inr, duration_hours
      from transit_routes order by duration_hours desc limit 3)`
  );
  section('Extremes — most likely to be visibly wrong');
  for (const r of extremes) {
    const money = `₹${Number(r.typical_cost_inr).toLocaleString('en-IN')}`;
    console.log(`  ${r.k.padEnd(9)} ${r.origin_city_id.padEnd(11)} ${r.destination_id.padEnd(22)} ${r.mode.padEnd(11)} ${money.padStart(8)}  ${r.duration_hours}h`);
  }

  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
