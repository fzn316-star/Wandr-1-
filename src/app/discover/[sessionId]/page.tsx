'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Compass } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import ChatContainer from '@/components/chat/ChatContainer';

/**
 * Epic 5.3: the session URL itself (FR-5.3.1). Landing here restores the full conversation,
 * saved destinations, and learned preferences within the 48h window (FR-5.3.2 / TC-504); a
 * session past its TTL bounces to the landing page with an explanation (FR-5.3.4 / TC-505).
 */
export default function DiscoverSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { hydrateSession, flagExpiredSession, chatMessages } = useWandrStore();
  const [state, setState] = useState<'restoring' | 'ready'>('restoring');

  const sessionId = params?.sessionId;

  useEffect(() => {
    if (!sessionId) return;

    // Restoring is a network round trip since Phase 2. `cancelled` guards against a
    // resolved fetch writing state after the user has already navigated away.
    let cancelled = false;

    void (async () => {
      const result = await hydrateSession(sessionId);
      if (cancelled) return;

      if (result === 'ok') {
        setState('ready');
        return;
      }

      // TC-505: expired and unknown sessions both land on a fresh start rather than a dead end.
      // `replace` keeps the stale URL out of history so Back doesn't bounce the user again.
      flagExpiredSession();
      router.replace('/');
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, hydrateSession, flagExpiredSession, router]);

  if (state === 'restoring' && chatMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-slate-700">
        <Compass className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-sm font-semibold">Restoring your discovery session…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatContainer />
    </div>
  );
}
