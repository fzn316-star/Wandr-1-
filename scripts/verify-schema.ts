/**
 * Post-migration verification. Confirms the objects the plan promises actually
 * exist, rather than trusting that the migration runner printed "ok".
 *
 * Run: npx tsx scripts/verify-schema.ts
 */
import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

const EXPECTED_TABLES = [
  'destinations',
  'origin_cities',
  'session_reactions',
  'sessions',
  'transit_routes',
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: tables } = await client.query<{ tablename: string; rowsecurity: boolean }>(
    `select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename`
  );

  console.log('Tables\n');
  for (const t of tables) {
    console.log(`  ${t.tablename.padEnd(20)} RLS ${t.rowsecurity ? 'on' : 'OFF'}`);
  }

  const found = new Set(tables.map((t) => t.tablename));
  const missing = EXPECTED_TABLES.filter((t) => !found.has(t));
  const noRls = tables.filter((t) => EXPECTED_TABLES.includes(t.tablename) && !t.rowsecurity);

  const { rows: policies } = await client.query<{ tablename: string; policyname: string }>(
    `select tablename, policyname from pg_policies where schemaname = 'public' order by tablename`
  );
  console.log(`\nPolicies (${policies.length})\n`);
  for (const p of policies) console.log(`  ${p.tablename.padEnd(20)} ${p.policyname}`);

  const { rows: constraint } = await client.query(
    `select 1 from pg_constraint where conname = 'what_to_know_min_two'`
  );
  const { rows: sweepFn } = await client.query(
    `select 1 from pg_proc where proname = 'delete_expired_sessions'`
  );
  const { rows: cols } = await client.query<{ n: number }>(
    `select count(*)::int as n from information_schema.columns where table_name = 'destinations'`
  );
  const { rows: cron } = await client.query(
    `select 1 from pg_extension where extname = 'pg_cron'`
  );

  // The sweep only reclaims storage — expiry itself is enforced on every read —
  // but if pg_cron is enabled we should be able to prove the job was scheduled
  // rather than assume the migration's DO block succeeded.
  let cronJob = 'n/a (pg_cron not enabled)';
  if (cron.length) {
    try {
      const { rows } = await client.query<{ schedule: string; active: boolean }>(
        `select schedule, active from cron.job where jobname = 'wandr_expire_sessions'`
      );
      cronJob = rows.length
        ? `scheduled "${rows[0].schedule}" active=${rows[0].active}`
        : 'NOT SCHEDULED';
    } catch (err) {
      cronJob = `not readable (${(err as Error).message})`;
    }
  }

  console.log('\nChecks\n');
  console.log(`  destinations columns          ${cols[0].n}`);
  console.log(`  what_to_know_min_two (FR-6.2.5) ${constraint.length ? 'present' : 'MISSING'}`);
  console.log(`  delete_expired_sessions()     ${sweepFn.length ? 'present' : 'MISSING'}`);
  console.log(`  pg_cron extension             ${cron.length ? 'enabled' : 'not enabled (optional)'}`);
  console.log(`  session sweep job             ${cronJob}`);

  const problems: string[] = [];
  if (missing.length) problems.push(`missing tables: ${missing.join(', ')}`);
  if (noRls.length) problems.push(`RLS off: ${noRls.map((t) => t.tablename).join(', ')}`);
  if (!constraint.length) problems.push('what_to_know_min_two constraint missing');
  if (!sweepFn.length) problems.push('delete_expired_sessions() missing');

  await client.end();

  if (problems.length) {
    console.log(`\nFAILED\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  console.log('\nSchema verified. Ready for seeding.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
