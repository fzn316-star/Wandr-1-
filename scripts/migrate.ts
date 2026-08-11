/**
 * Applies every .sql file in supabase/migrations/ in filename order, once.
 *
 * Run: npm run db:migrate
 *
 * Each migration runs inside a transaction and is recorded in `_migrations`, so
 * re-running is a no-op. Individual migration files are still written to be
 * idempotent (`if not exists`) so a partially-applied database can be repaired.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { config } from 'dotenv';

// See scripts/check-env.ts — `dotenv/config` would load `.env`, not `.env.local`.
config({ path: '.env.local' });

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      'DATABASE_URL is not set. Copy .env.local.example to .env.local and paste your\n' +
        'Supabase connection string (Dashboard → Project Settings → Database → Connection string → URI).'
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    // Supabase terminates TLS with a cert chain Node doesn't ship a root for.
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    create table if not exists _migrations (
      filename   text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  // Bookkeeping, not app data. Supabase grants anon/authenticated access to new
  // public-schema tables by default, so without RLS this table's contents (our
  // migration filenames) are readable through PostgREST with just the anon key.
  // RLS on with no policy exposes nothing; the service role running migrations
  // bypasses RLS, so this is invisible to the migrator itself.
  await client.query('alter table _migrations enable row level security');

  const applied = new Set(
    (await client.query<{ filename: string }>('select filename from _migrations')).rows.map(
      (r) => r.filename
    )
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into _migrations (filename) values ($1)', [file]);
      await client.query('commit');
      console.log(`  ok    ${file}`);
      ran++;
    } catch (err) {
      await client.query('rollback');
      console.error(`  FAIL  ${file}`);
      throw err;
    }
  }

  console.log(`\n${ran} migration(s) applied, ${files.length - ran} already current.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
