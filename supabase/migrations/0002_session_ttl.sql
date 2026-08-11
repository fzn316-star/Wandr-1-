-- Session TTL sweeper (§2, "Session TTL")
--
-- Expiry correctness does NOT depend on this job: every read filters on
-- `expires_at > now()`. The job only reclaims storage, so it is safe for this
-- migration to no-op when pg_cron is unavailable (local Postgres, or a Supabase
-- project where the extension has not been enabled in Dashboard → Database →
-- Extensions). Enable it there and re-run this migration to activate the sweep.

create or replace function delete_expired_sessions() returns void as $$
  delete from sessions where expires_at <= now();
$$ language sql;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- Unschedule first so re-running this migration doesn't stack duplicate jobs.
    perform cron.unschedule(jobid) from cron.job where jobname = 'wandr_expire_sessions';

    perform cron.schedule(
      'wandr_expire_sessions',
      '0 * * * *',                      -- hourly
      $job$ select delete_expired_sessions(); $job$
    );
  else
    raise notice 'pg_cron unavailable — skipping session sweep schedule. Reads still filter on expires_at, so expiry remains correct.';
  end if;
exception
  when insufficient_privilege then
    raise notice 'pg_cron present but not permitted for this role — skipping session sweep schedule.';
end $$;
