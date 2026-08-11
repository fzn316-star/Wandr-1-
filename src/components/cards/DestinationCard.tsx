'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Destination } from '@/types';
import { Heart, Bookmark, X, ExternalLink, Sparkles, HelpCircle, MapPin, Calendar, IndianRupee, Plane, MessageCircleQuestion, ChevronDown } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import { getEffectiveTransitTier, estimateTransitCostINR, describeTransitMode, formatINR } from '@/lib/transitMatrix';

interface DestinationCardProps {
  destination: Destination;
  index?: number;
}

export default function DestinationCard({ destination, index = 0 }: DestinationCardProps) {
  const {
    saveDestination,
    unsaveDestination,
    savedDestinations,
    dismissDestination,
    setActiveDeepDiveDestination,
    askWhyDestination,
    likedDestinationIds,
    toggleLikeDestination,
    constraints,
  } = useWandrStore();
  const [isDismissing, setIsDismissing] = useState(false);
  const [showMicroChips, setShowMicroChips] = useState(false);
  const [showCostSplit, setShowCostSplit] = useState(false);

  // FR-7.1.4/7.2.2/7.2.3: origin-aware transit tier — falls back to the destination's static
  // tier when no origin region is set, so this stays fully optional (DP-3)
  const effectiveTransitTier = getEffectiveTransitTier(destination, constraints.originCity);
  const transitEstimate = estimateTransitCostINR(effectiveTransitTier);

  const isSaved = savedDestinations.some((d) => d.id === destination.id);
  const isLiked = likedDestinationIds.includes(destination.id);

  const handleSaveToggle = () => {
    if (isSaved) {
      unsaveDestination(destination.id);
    } else {
      saveDestination(destination);
    }
  };

  const handleDismiss = (reasonChip?: string) => {
    dismissDestination(destination.id, reasonChip);
    setIsDismissing(true);
  };

  if (isDismissing) {
    return null; // Animated exit
  }

  return (
    <div
      className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col group relative my-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDelay: `${index * 120}ms`, animationDuration: '450ms' }}
    >
      {/* Hero Image Header */}
      <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-slate-900">
        <Image
          src={destination.heroImageUrl}
          alt={destination.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {/* Match Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{destination.matchScore}% Match</span>
          </div>

          {/* Quick Reaction Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Heart / Like Button */}
            <button
              onClick={() => toggleLikeDestination(destination.id)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                isLiked
                  ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/30'
                  : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-rose-400 border border-slate-700/60'
              }`}
              title="Interested (❤️)"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {/* Save / Bookmark Button */}
            <button
              onClick={handleSaveToggle}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                isSaved
                  ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-amber-400 border border-slate-700/60'
              }`}
              title="Save to collection (🔖)"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Dismiss Button */}
            <button
              onClick={() => setShowMicroChips(!showMicroChips)}
              className="p-2.5 rounded-full bg-slate-950/70 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-all duration-200"
              title="Not for me (✖️)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Destination Name & Tagline Overlay */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
          <div className="flex items-center gap-1.5 text-xs text-orange-300 font-semibold uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination.region}</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
            {destination.name}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-medium opacity-90">
            {destination.tagline}
          </p>
        </div>
      </div>

      {/* Dismiss Micro-Chips Popup (TC-404) */}
      {showMicroChips && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
          <span className="text-slate-400 font-medium">Why isn't this right?</span>
          {['Too expensive', 'Too far', 'Wrong vibe', 'Been before'].map((reason) => (
            <button
              key={reason}
              onClick={() => handleDismiss(reason)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
            >
              {reason}
            </button>
          ))}
        </div>
      )}

      {/* Card Content Body */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-white/95">
        {/* Vibe Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {destination.vibeTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Transit vs. Ground Cost Split Indicator (FR-7.2.1) */}
        <div>
          <button
            type="button"
            onClick={() => setShowCostSplit((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-300 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost Split</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span>✈️ {effectiveTransitTier}</span>
                <span className="text-slate-300">|</span>
                <span>🏨 {destination.quickStats.groundCostTier}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCostSplit ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {showCostSplit && (
            <div className="mt-1.5 p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-900 space-y-1 animate-in fade-in duration-150">
              {/* A real per-route figure when we have one, the coarse four-value
                  tier only as a fallback. The two are visually distinct on purpose:
                  presenting a generated band with the same confidence as a
                  specific route would overstate what we actually know. */}
              {destination.originTransit ? (
                <p>
                  ✈️ <strong>{formatINR(destination.originTransit.costINR)}</strong> round-trip from{' '}
                  {destination.originTransit.originCity} · {destination.originTransit.durationHours}h each way
                  {destination.originTransit.isEstimate && (
                    <span className="text-teal-700/70"> (estimate)</span>
                  )}
                </p>
              ) : (
                <p>✈️ Est. transit tier <strong>{effectiveTransitTier}</strong> — roughly {formatINR(transitEstimate)} round-trip</p>
              )}
              <p>🏨 Est. daily ground cost <strong>{destination.quickStats.groundCostTier}</strong> — roughly {formatINR(destination.quickStats.avgDailyCostINR)}/day</p>
              <p>{describeTransitMode(destination.quickStats.primaryMode)} via {destination.quickStats.nearestAccess}</p>
              {!constraints.originCity && (
                <p className="text-teal-700/80 italic">Add your departure city on the home screen for a sharper transit estimate.</p>
              )}
            </div>
          )}
        </div>

        {/* Personalized "Why This Matches You" Rationale (TC-205) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Why You'll Love It</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            "{destination.matchRationale}"
          </p>
          <button
            type="button"
            onClick={() => askWhyDestination(destination)}
            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            <span>Ask &ldquo;why?&rdquo; in chat</span>
          </button>
        </div>

        {/* Curiosity Hook */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="italic font-medium">"{destination.curiosityHook}"</p>
        </div>

        {/* Quick Stats Pill Header (TC-401) */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] font-semibold">
              <Calendar className="w-3 h-3 text-orange-500" />
              <span>Best Time</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5 text-[11px] truncate">
              {destination.quickStats.bestTime}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] font-semibold">
              <IndianRupee className="w-3 h-3 text-teal-600" />
              <span>Avg Daily</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5 text-[11px] tabular-nums">
              {formatINR(destination.quickStats.avgDailyCostINR)}/day
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] font-semibold">
              <Plane className="w-3 h-3 text-rose-500" />
              <span>Transit</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5 text-[11px]">
              {destination.quickStats.transitHours} hrs ({destination.quickStats.transitCostTier})
            </p>
          </div>
        </div>

        {/* Deep Dive Action Button */}
        <button
          onClick={() => setActiveDeepDiveDestination(destination)}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-900 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-orange-200 hover:border-orange-500 transition-all duration-200 group/btn shadow-sm"
        >
          <span>Tell Me More (Deep-Dive)</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
