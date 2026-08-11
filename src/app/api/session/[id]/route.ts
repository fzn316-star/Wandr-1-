import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { scrubSession } from '@/lib/pii';
import { PersistedSession } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * NFR-5.3.2 / §7: expired and unknown sessions MUST be indistinguishable. Returning
 * a different status for "existed but expired" confirms a session ID was real, which
 * turns the non-guessable URL into an oracle. The frontend already shows one banner
 * for both cases, so there is nothing to lose by collapsing them.
 */
const notFound = () =>
  NextResponse.json({ error: 'not_found' }, { status: 404 });

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // A malformed ID can never match a real row, so reject it on the same path —
  // a distinct 400 here would leak that the ID space is being validated.
  if (!UUID_V4.test(id)) return notFound();

  const { data, error } = await supabaseAdmin()
    .from('sessions')
    .select('id, created_at, expires_at, state')
    .eq('id', id)
    // Expiry is enforced on read, so a lagging pg_cron sweep can never resurrect
    // a session that is past its 48 hours (FR-5.3.4).
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('[session:GET]', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  if (!data) return notFound();

  const state = data.state as PersistedSession;

  return NextResponse.json(
    {
      ...state,
      sessionId: data.id,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}

/**
 * Upsert. Creates the row on the first meaningful write and updates it thereafter.
 *
 * Deviation from the plan's §5 table, which had POST /api/session mint the UUID:
 * `ensureSessionId` fires on landing-page mount, so minting server-side would insert
 * a row for every visitor who never starts a conversation. The client generates a
 * UUIDv4 (equally non-guessable — NFR-5.3.2 is about entropy, not origin) and the row
 * is created here on first persist instead.
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_V4.test(id)) return notFound();

  let body: PersistedSession;
  try {
    body = (await req.json()) as PersistedSession;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !Array.isArray(body.chatMessages)) {
    return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
  }

  // The URL is authoritative — a body claiming a different sessionId must not be
  // able to write to a session the caller didn't address.
  const state = scrubSession({ ...body, sessionId: id });

  const supabase = supabaseAdmin();

  const { data: existing, error: readError } = await supabase
    .from('sessions')
    .select('id, expires_at')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    console.error('[session:PUT:read]', readError.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // FR-5.3.4: the 48-hour window runs from creation. Writing state must not extend
  // it, or an active session would never expire.
  if (existing && new Date(existing.expires_at).getTime() <= Date.now()) {
    return notFound();
  }

  const { data, error } = existing
    ? await supabase.from('sessions').update({ state }).eq('id', id).select('created_at, expires_at').single()
    : await supabase.from('sessions').insert({ id, state }).select('created_at, expires_at').single();

  if (error) {
    console.error('[session:PUT:write]', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: id,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_V4.test(id)) return notFound();

  const { error } = await supabaseAdmin().from('sessions').delete().eq('id', id);
  if (error) {
    console.error('[session:DELETE]', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
