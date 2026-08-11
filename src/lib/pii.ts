import { ChatMessage, PersistedSession } from '@/types';

/**
 * TC-SEC-905: chat transcripts are persisted for 48 hours, so anything a traveller
 * volunteers ("email me at …", "my number is …") would sit in the database with no
 * account to own it and no way for them to delete it. Scrubbing on the write path
 * means the raw value never lands, rather than being redacted on read and still
 * present in a backup.
 *
 * Deliberately conservative: over-redacting a message is a cosmetic problem,
 * under-redacting is a data-protection one.
 */

const PATTERNS: Array<[RegExp, string]> = [
  // Email. Runs first so an address containing digits isn't half-eaten by the phone rule.
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]'],

  // Indian mobile numbers, with or without +91 / 0 prefix and common separators.
  [/(?:\+?91[\s-]?|\b0)?[6-9]\d{4}[\s-]?\d{5}\b/g, '[phone removed]'],

  // Generic 10+ digit runs that survive the above (international formats).
  [/\b(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){10,14}\b/g, '[phone removed]'],

  // Card-shaped 13–16 digit sequences. Nothing in this product should ever collect
  // one, which is exactly why an appearance is worth destroying rather than storing.
  [/\b(?:\d[ -]?){13,16}\b/g, '[number removed]'],
];

export function scrubText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

export function scrubMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    const text = scrubText(m.text);
    return text === m.text ? m : { ...m, text };
  });
}

/**
 * Scrubs the free-text surfaces of a session before it is written. Destination
 * records are curated KB data and are left untouched.
 */
export function scrubSession(session: PersistedSession): PersistedSession {
  return {
    ...session,
    title: scrubText(session.title),
    moodText: scrubText(session.moodText),
    chatMessages: scrubMessages(session.chatMessages),
  };
}
