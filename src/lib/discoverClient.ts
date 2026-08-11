import { Destination } from '@/types';

/**
 * Browser-side consumer for the /api/discover SSE contract (§5).
 *
 * Replaces the `setTimeout` mock in the store. The event names and payloads
 * mirror the route exactly; anything unrecognised is ignored so the server can
 * add events without breaking older clients mid-session.
 */

export interface DiscoverHandlers {
  /** Fired once, when the model starts reasoning — before any prose exists. */
  onThinking?: () => void;
  onTextDelta?: (delta: string) => void;
  onCards?: (destinations: Destination[], isFallback: boolean) => void;
  onQuickReplies?: (replies: string[]) => void;
  onDone?: (fullText: string, isFallback: boolean) => void;
  onError?: (message: string) => void;
}

export interface DiscoverRequest {
  message: string;
  history?: Array<{ sender: 'user' | 'ai'; text: string }>;
  signal?: AbortSignal;
}

export async function streamDiscovery(
  req: DiscoverRequest,
  handlers: DiscoverHandlers
): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: req.message, history: req.history }),
      signal: req.signal,
    });
  } catch (err) {
    // AbortError is a normal navigation, not a failure worth surfacing.
    if ((err as Error).name !== 'AbortError') {
      handlers.onError?.('Could not reach the discovery service.');
    }
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError?.(`Discovery failed (${res.status}).`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let isFallback = false;
  let doneEmitted = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line. A partial frame stays in the
      // buffer until the rest of it arrives.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        let event = '';
        let dataRaw = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataRaw = line.slice(5).trim();
        }
        if (!event || !dataRaw) continue;

        let data: any;
        try {
          data = JSON.parse(dataRaw);
        } catch {
          continue;
        }

        switch (event) {
          case 'thinking':
            handlers.onThinking?.();
            break;
          case 'text':
            fullText += data.delta;
            handlers.onTextDelta?.(data.delta);
            break;
          case 'cards':
            isFallback = Boolean(data.isFallback);
            handlers.onCards?.(data.destinations as Destination[], isFallback);
            break;
          case 'quick':
            handlers.onQuickReplies?.(data.replies as string[]);
            break;
          case 'done':
            doneEmitted = true;
            handlers.onDone?.(data.text ?? fullText, Boolean(data.isFallback));
            break;
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      handlers.onError?.('The connection dropped mid-response.');
    }
    return;
  }

  // Defensive: if the stream ended without a `done` frame (proxy cut, server
  // crash), the caller still needs to leave its loading state.
  if (!doneEmitted) handlers.onDone?.(fullText, isFallback);
}
