'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Info } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import VisualMoodTiles from './VisualMoodTiles';
import BudgetWidget from './BudgetWidget';
import { MOCK_EXAMPLE_PROMPTS } from '@/lib/mockData';

export default function MoodHero() {
  const { moodText, setMoodText, submitMoodPrompt } = useWandrStore();
  const router = useRouter();

  const [activePromptIndex, setActivePromptIndex] = useState(0);

  // Cycle example prompts
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromptIndex((prev) => (prev + 1) % MOCK_EXAMPLE_PROMPTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const trimmed = moodText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const showShortInputHint = wordCount > 0 && wordCount < 3;

  // FR-5.3.1: a started conversation lives at its own session URL from the first message,
  // so the link is shareable/restorable without the user having to do anything.
  const goToSession = () => {
    const { sessionId } = useWandrStore.getState();
    if (sessionId) router.push(`/discover/${sessionId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    submitMoodPrompt();
    goToSession();
  };

  const handleChipClick = (promptText: string) => {
    setMoodText(promptText);
    submitMoodPrompt(promptText);
    goToSession();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-500">
      {/* Compact shared headline */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-orange-200 text-orange-700 text-[11px] font-semibold backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>Your next escape, one feeling away</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-[1.1] drop-shadow-sm">
          What kind of{' '}
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            escape
          </span>{' '}
          are you dreaming of?
        </h1>
        <p className="text-slate-600 text-sm font-medium max-w-lg mx-auto leading-relaxed">
          Describe it in your own words, or tap a vibe — either way works.
        </p>
      </div>

      {/* ═══ Two clearly separated entry paths ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 lg:gap-6 items-stretch">

        {/* ─── LEFT: Describe it ─── */}
        <div className="flex flex-col space-y-3 p-4 sm:p-5 rounded-2xl bg-white/70 border border-white/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            ✍️ Describe it
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
            <textarea
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              rows={3}
              placeholder="e.g. I'm burnt out and need quiet nature near great food..."
              className="w-full resize-none bg-white/95 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-xl py-3 px-4 border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 shadow-md transition-all"
            />

            {showShortInputHint && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 text-[11px] animate-in fade-in duration-200">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>{wordCount} word{wordCount > 1 ? 's' : ''}</strong> — add budget or detail below for sharper results.
                </p>
              </div>
            )}

            {/* Rotating example prompts */}
            <div className="flex flex-wrap gap-1.5">
              {MOCK_EXAMPLE_PROMPTS.slice(0, 2).map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(promptText)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 text-left ${
                    activePromptIndex === idx
                      ? 'bg-orange-500 text-white border border-orange-400 shadow-sm'
                      : 'bg-white/85 hover:bg-white text-slate-600 border border-slate-200 hover:border-orange-300 shadow-sm'
                  }`}
                >
                  &ldquo;{promptText.slice(0, 42)}&hellip;&rdquo;
                </button>
              ))}
            </div>

            {/* Budget — anchored directly to the chat box, since typed prompts may skip it */}
            <BudgetWidget />

            {/* Send — directly below the chat box, this path's own clear submit action */}
            <button
              type="submit"
              disabled={!trimmed}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* ─── Divider: horizontal on mobile, vertical on desktop ─── */}
        <div className="flex lg:flex-col items-center justify-center gap-3 lg:gap-2 lg:py-4">
          <div className="flex-1 lg:flex-1 lg:w-px h-px lg:h-auto w-full bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-orange-200 to-transparent" />
          <span className="shrink-0 text-[11px] font-black text-orange-500 uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200">
            OR
          </span>
          <div className="flex-1 lg:flex-1 lg:w-px h-px lg:h-auto w-full bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-orange-200 to-transparent" />
        </div>

        {/* ─── RIGHT: Tap a vibe ─── */}
        <div className="flex flex-col space-y-3 p-4 sm:p-5 rounded-2xl bg-white/70 border border-white/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            🎨 Tap a vibe
          </h3>
          <VisualMoodTiles />
        </div>

      </div>
    </div>
  );
}
