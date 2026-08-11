'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_MOOD_TILES } from '@/lib/mockData';
import { useWandrStore } from '@/store/useWandrStore';
import { Check, X, Sparkles, ArrowRight, Users, CalendarDays } from 'lucide-react';
import { TravelMode } from '@/types';
import BudgetWidget from './BudgetWidget';

// FR-3.1.4: the six supported context modes. These stay optional shortcuts (DP-3) — the same
// modes are inferred passively from conversation, so nothing here is required.
const COMPANION_OPTIONS: { id: TravelMode; label: string; emoji: string }[] = [
  { id: 'solo', label: 'Solo', emoji: '🧍' },
  { id: 'couple', label: 'Couple', emoji: '💑' },
  { id: 'friends', label: 'Friends', emoji: '🧑‍🤝‍🧑' },
  { id: 'family_young_kids', label: 'Family (young kids)', emoji: '👨‍👩‍👧' },
  { id: 'family_teens', label: 'Family (teens)', emoji: '👨‍👩‍👦' },
  { id: 'digital_nomad', label: 'Working remotely', emoji: '💻' },
];

const TIMING_OPTIONS: { id: string; label: string }[] = [
  { id: 'flexible', label: "I'm flexible" },
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'fall', label: 'Fall' },
  { id: 'winter', label: 'Winter' },
  { id: 'surprise', label: 'Surprise me' },
];

export default function VisualMoodTiles() {
  const {
    selectedTileIds,
    toggleMoodTile,
    clearMoodTiles,
    submitMoodPrompt,
    constraints,
    setTravelerMode,
    updateConstraints,
  } = useWandrStore();
  const router = useRouter();

  const selectedTiles = MOCK_MOOD_TILES.filter((t) => selectedTileIds.includes(t.id));

  // Same requirement as the typed path — origin drives every cost figure.
  const hasOrigin = Boolean(constraints.originCity);

  const handleExplore = () => {
    if (!hasOrigin) return;
    submitMoodPrompt();
    const { sessionId } = useWandrStore.getState();
    if (sessionId) router.push(`/discover/${sessionId}`);
  };

  const handleTiming = (timingId: string) => {
    updateConstraints({
      travelMonth: timingId,
      datesFlexibility: timingId === 'surprise' ? 'surprise' : 'flexible_month',
    });
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Tap 1–3 that call to you
        </span>

        {selectedTileIds.length > 0 && (
          <button
            type="button"
            onClick={clearMoodTiles}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Mood Tiles Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {MOCK_MOOD_TILES.map((tile) => {
          const isSelected = selectedTileIds.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => toggleMoodTile(tile.id)}
              className={`relative group rounded-xl p-3 text-left transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'bg-white border-2 border-orange-400 shadow-lg shadow-orange-500/15 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white border border-white/80 hover:border-orange-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Top accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 opacity-100'
                    : 'bg-gradient-to-r from-slate-200 to-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              />

              {/* Selection indicator */}
              <div
                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-orange-500 text-white scale-100 shadow-md'
                    : 'bg-slate-100 text-slate-300 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>

              {/* Content */}
              <div className="flex items-start gap-2.5">
                <div className="text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {tile.emoji}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-bold text-xs text-slate-900 tracking-tight mb-0.5">
                    {tile.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {tile.tagline}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection confirmation strip */}
      {selectedTileIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs animate-in fade-in slide-in-from-bottom-1 duration-300">
          <span className="font-bold text-orange-800">
            {selectedTileIds.length} vibe{selectedTileIds.length > 1 ? 's' : ''}:
          </span>
          <span className="text-orange-700 font-semibold">
            {selectedTiles.map((t) => `${t.emoji} ${t.label}`).join('  •  ')}
          </span>
        </div>
      )}

      {/* Budget — also here, since a tile-only tap might never mention it */}
      <BudgetWidget />

      {/* Who's coming */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-teal-600" />
          <span>Who&apos;s coming</span>
          <span className="text-slate-300 font-normal normal-case">(optional)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMPANION_OPTIONS.map((opt) => {
            const isActive = constraints.travelMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTravelerMode(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* When */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
          <span>When</span>
          <span className="text-slate-300 font-normal normal-case">(optional)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIMING_OPTIONS.map((opt) => {
            const isActive = constraints.travelMonth === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleTiming(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Self-contained submit for the tap path */}
      <button
        type="button"
        disabled={selectedTileIds.length === 0 || !hasOrigin}
        onClick={handleExplore}
        className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
      >
        <Sparkles className="w-4 h-4" />
        <span>Explore These Vibes</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
      {/* The origin picker lives in the panel beside this one, so a tile-path user
          needs telling where the blocker is — otherwise the button just looks dead. */}
      {selectedTileIds.length > 0 && !hasOrigin && (
        <p className="text-[11px] font-semibold text-orange-600 text-center">
          Pick where you&rsquo;re travelling from first — it&rsquo;s in the panel on the left.
        </p>
      )}
    </div>
  );
}
