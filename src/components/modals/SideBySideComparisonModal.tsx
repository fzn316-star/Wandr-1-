'use client';

import React from 'react';
import Image from 'next/image';
import { useWandrStore } from '@/store/useWandrStore';
import { X, Columns, Sparkles, Plane } from 'lucide-react';
import { getEffectiveTransitTier, formatINR } from '@/lib/transitMatrix';

export default function SideBySideComparisonModal() {
  const { savedDestinations, isComparisonOpen, setIsComparisonOpen, comparisonDestinationIds, constraints } = useWandrStore();

  if (!isComparisonOpen) return null;

  const compareItems = savedDestinations.filter((d) => comparisonDestinationIds.includes(d.id)).slice(0, 3);

  // Dynamic synthesis — derived from whichever destinations are actually selected, not hardcoded
  const cheapest = [...compareItems].sort((a, b) => a.quickStats.avgDailyCostINR - b.quickStats.avgDailyCostINR)[0];
  const bestMatch = [...compareItems].sort((a, b) => b.matchScore - a.matchScore)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white/95 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-slate-900">Side-by-Side Destination Comparison</h2>
              <p className="text-xs text-slate-500">Comparing {compareItems.length} saved options</p>
            </div>
          </div>

          <button
            onClick={() => setIsComparisonOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {compareItems.length < 2 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Select at least 2 saved destinations from the Saved panel to compare them.
            </div>
          ) : (
            <>
              {/* AI Narrative Synthesis at Top */}
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-slate-700 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-orange-700">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>AI Comparative Synthesis</span>
                </div>
                {cheapest.id === bestMatch.id ? (
                  <p>
                    <strong className="text-slate-900">{cheapest.name}</strong> is the standout here — both the best value at{' '}
                    <strong className="text-slate-900">{formatINR(cheapest.quickStats.avgDailyCostINR)}/day</strong> and the strongest match to your
                    mood at <strong className="text-slate-900">{bestMatch.matchScore}%</strong>.
                  </p>
                ) : (
                  <p>
                    If you prioritize <strong>lower daily costs</strong>, <strong className="text-slate-900">{cheapest.name}</strong> wins
                    at {formatINR(cheapest.quickStats.avgDailyCostINR)}/day. If you want the <strong>strongest overall match</strong> to your stated
                    mood, <strong className="text-slate-900">{bestMatch.name}</strong> leads at {bestMatch.matchScore}%.
                  </p>
                )}
              </div>

              {/* Comparative Grid Columns */}
              <div
                className="grid grid-cols-1 gap-4"
                style={{ gridTemplateColumns: `repeat(${compareItems.length}, minmax(0, 1fr))` }}
              >
                {compareItems.map((item) => (
                  <div key={item.id} className="glass-card rounded-2xl p-4 border border-slate-200 space-y-4">
                    {/* Hero Photo */}
                    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-200">
                      <Image src={item.heroImageUrl} alt={item.name} fill className="object-cover" />
                      <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {item.matchScore}% Match
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{item.name}</h3>
                      <p className="text-xs text-orange-600 font-semibold">{item.country}</p>
                    </div>

                    {/* Attributes Comparison List */}
                    <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
                      {/* Transit vs. Ground Cost Split Indicator (FR-7.2.1) — origin-aware when set */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Cost Split</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          ✈️ {getEffectiveTransitTier(item, constraints.originCity)} <span className="text-slate-300">|</span> 🏨 {item.quickStats.groundCostTier}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">Avg Daily Cost</span>
                        <span className="font-bold text-teal-600 tabular-nums">{formatINR(item.quickStats.avgDailyCostINR)} / day</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">Transit</span>
                        <span className="font-bold text-rose-500 flex items-center gap-1">
                          <Plane className="w-3 h-3" />
                          {item.quickStats.transitHours} hrs ({item.quickStats.transitCostTier})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">Best Season</span>
                        <span className="font-semibold text-slate-700">{item.quickStats.bestTime}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">Vibe Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.vibeTags.map((v) => (
                            <span key={v} className="px-2 py-0.5 rounded bg-orange-50 border border-orange-100 text-[10px] text-orange-700 font-semibold">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
