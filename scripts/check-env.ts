/**
 * Pre-flight check. Verifies .env.local is filled in and that the database is
 * actually reachable, BEFORE we start running migrations against it.
 *
 * Run: npm run db:check
 *
 * Prints only key prefixes and lengths, never full secrets.
 */
import { Client } from 'pg';
import { config } from 'dotenv';

// Next.js reads .env.local automatically; plain tsx scripts do not, and
// `dotenv/config` defaults to `.env`. Point it at the file that actually holds
// the secrets, or every check below reports MISSING against a filled-in file.
config({ path: '.env.local' });

const REQUIRED = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
] as const;

function mask(value: string): string {
  if (value.length <= 8) return `${'*'.repeat(value.length)} (${value.length} chars)`;
  return `${value.slice(0, 6)}…${value.slice(-2)} (${value.length} chars)`;
}

async function main() {
  console.log('Environment variables\n');

  let missing = 0;
  for (const key of REQUIRED) {
    const value = process.env[key];
    // A copied-but-unedited .env.local still has the bracket placeholders in it,
    // which is a different failure from "empty" and worth naming separately.
    if (!value) {
      console.log(`  MISSING  ${key}`);
      missing++;
    } else if (value.includes('[') && value.includes(']')) {
      console.log(`  PLACEHOLDER  ${key} — still contains [BRACKETS], not filled in`);
      missing++;
    } else if (key === 'DATABASE_URL') {
      console.log(`  ok       ${key} = ${value.replace(/:[^:@]+@/, ':****@')}`);
    } else if (key === 'NEXT_PUBLIC_SUPABASE_URL' || key === 'DEEPSEEK_BASE_URL') {
      console.log(`  ok       ${key} = ${value}`);
    } else {
      console.log(`  ok       ${key} = ${mask(value)}`);
    }
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('\n  WARNING: service_role key is identical to the anon key — you likely copied the same one twice.');
    missing++;
  }

  // Strict tool schemas are only enforced on DeepSeek's /beta endpoint. On the
  // standard endpoint the request still succeeds — the enum constraint just
  // stops being enforced, which is exactly the failure the grounding contract
  // exists to prevent, and it is silent. Worth failing loudly here.
  if (process.env.DEEPSEEK_BASE_URL && !/\/beta\/?$/.test(process.env.DEEPSEEK_BASE_URL)) {
    console.log('\n  WARNING: DEEPSEEK_BASE_URL does not end in /beta — strict tool schemas');
    console.log('           will not be enforced, and the failure is silent.');
    missing++;
  }

  if (missing > 0) {
    console.log(`\n${missing} value(s) need attention. Fix .env.local and re-run.`);
    process.exit(1);
  }

  console.log('\nDatabase connection\n');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ version: string; db: string; now: Date }>(
      'select version() as version, current_database() as db, now() as now'
    );
    console.log(`  ok       connected to "${rows[0].db}"`);
    console.log(`  ok       ${rows[0].version.split(' on ')[0]}`);
    console.log(`  ok       server time ${rows[0].now.toISOString()}`);

    const { rows: ext } = await client.query<{ name: string }>(
      "select name from pg_available_extensions where name = 'pg_cron' and installed_version is not null"
    );
    console.log(
      ext.length
        ? '  ok       pg_cron enabled — hourly session sweep will be scheduled'
        : '  note     pg_cron not enabled — optional, session expiry still correct without it'
    );

    await client.end();
    console.log('\nAll good. Ready for: npm run db:migrate');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  FAILED   ${message}\n`);
    if (/password authentication failed/i.test(message)) {
      console.log('  → Wrong DB password, or special characters in it are not URL-encoded (@ → %40, # → %23).');
    } else if (/ENOTFOUND|EAI_AGAIN/i.test(message)) {
      console.log('  → Host in DATABASE_URL is wrong. Re-copy it from Dashboard → Connect → Session pooler.');
    } else if (/ETIMEDOUT|ECONNREFUSED|ENETUNREACH/i.test(message)) {
      console.log('  → Unreachable. If you used the "Direct connection" URI, switch to "Session pooler" —');
      console.log('    direct connections are IPv6-only and most home ISPs cannot route them.');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
