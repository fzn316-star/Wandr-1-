'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useWandrStore } from '@/store/useWandrStore';
import {
  X,
  Sparkles,
  Calendar,
  IndianRupee,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  Compass,
  Check,
  Users,
  Info,
} from 'lucide-react';
import { getEffectiveTransitTier, estimateTransitCostINR, describeTransitMode, formatINR } from '@/lib/transitMatrix';
import { TRAVEL_MODE_PHRASES } from '@/lib/travelContext';

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DeepDiveModal() {
  const { activeDeepDiveDestination, setActiveDeepDiveDestination, constraints, moodText, maxBudgetINR } = useWandrStore();
  const [copied, setCopied] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!activeDeepDiveDestination) return null;

  const dest = activeDeepDiveDestination;

  // Calculate Budget Duration Optimizer (TC-701) — uses the user's actual selected budget
  // and the origin-aware transit tier
  const userBudget = maxBudgetINR || 40000;
  const effectiveTransitTier = getEffectiveTransitTier(dest, constraints.originCity);
  const transitCostEstimate = estimateTransitCostINR(effectiveTransitTier);
  const netGroundBudget = Math.max(0, userBudget - transitCostEstimate);
  const affordableDays = Math.round(netGroundBudget / dest.quickStats.avgDailyCostINR);

  // FR-6.1.2: Budget guide — realistic daily cost tiers, estimated off the KB's average daily cost
  const budgetTierDaily = Math.round(dest.quickStats.avgDailyCostINR * 0.6);
  const midTierDaily = dest.quickStats.avgDailyCostINR;
  const comfortTierDaily = Math.round(dest.quickStats.avgDailyCostINR * 1.8);

  // FR-6.1.5: personalize the overview intro with the user's actual stated context, not generic copy
  const personalizedIntro = (() => {
    const parts: string[] = [];
    if (constraints.travelMode) {
      parts.push(`you're ${TRAVEL_MODE_PHRASES[constraints.travelMode]}`);
    }
    if (moodText.trim()) {
      const trimmed = moodText.trim();
      parts.push(`mentioned wanting "${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}"`);
    }
    if (parts.length === 0) return null;
    return `Since ${parts.join(' and ')}, here's why ${dest.name} could be the one:`;
  })();

  const handleCopyShareLink = async () => {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?destination=${dest.id}` : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API unavailable in this context — UI still confirms optimistically
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white/95 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-slate-900">{dest.name}</h2>
              <p className="text-xs text-orange-600 font-semibold">{dest.country} • {dest.region}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Discovery Button */}
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => setActiveDeepDiveDestination(null)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {/* Section 1: Hero Image Gallery (4-6 photos) */}
          <div className="space-y-3">
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-xl">
              <Image
                src={dest.galleryUrls[activePhotoIdx] || dest.heroImageUrl}
                alt={dest.name}
                fill
                priority
                className="object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-bold text-orange-300 uppercase tracking-widest px-2.5 py-1 rounded bg-slate-950/70 border border-orange-400/30">
                  Photo {activePhotoIdx + 1} of {dest.galleryUrls.length}
                </span>
                <p className="text-sm font-medium mt-1 drop-shadow-md">{dest.tagline}</p>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dest.galleryUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activePhotoIdx === idx ? 'border-orange-400 scale-105 shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={url} alt="thumbnail" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Best For Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Best for:
            </span>
            {dest.bestForTags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>

          {/* Section 3: Personalized Overview */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Personalized Overview</span>
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed glass-panel p-4 rounded-2xl border border-orange-100 space-y-2">
              {personalizedIntro && <p className="font-bold text-slate-900">{personalizedIntro}</p>}
              <p>{dest.overviewSummary}</p>
            </div>
          </div>

          {/* Section 4: Best Time to Visit */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Best Time to Visit</span>
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ALL_MONTHS.map((month) => {
                  const isBest = dest.weather.bestMonths.includes(month);
                  return (
                    <span
                      key={month}
                      className={`w-10 text-center py-1 rounded-lg text-[11px] font-bold ${
                        isBest ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {month}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">{dest.weather.tempRangeC}</span> — {dest.weather.seasonalityNotes}
              </p>
            </div>
          </div>

          {/* Section 5: Budget Guide (realistic daily cost tiers) */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-teal-600" />
              <span>Budget Guide</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget (₹)</span>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5 tabular-nums">{formatINR(budgetTierDaily)}<span className="text-xs font-medium text-slate-400">/day</span></p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border-2 border-orange-300 text-center shadow-sm">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Mid-Range (₹₹)</span>
                <p className="text-lg font-extrabold text-orange-700 mt-0.5 tabular-nums">{formatINR(midTierDaily)}<span className="text-xs font-medium text-orange-400">/day</span></p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comfort (₹₹₹)</span>
                <p className="text-lg font-extrabold text-slate-800 mt-0.5 tabular-nums">{formatINR(comfortTierDaily)}<span className="text-xs font-medium text-slate-400">/day</span></p>
              </div>
            </div>
          </div>

          {/* Section 6: Total-Budget Duration Optimizer Widget (TC-701) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 border border-orange-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-2 text-orange-700 font-bold text-sm">
                <IndianRupee className="w-4 h-4 text-teal-600" />
                <span>Total-Budget Duration Optimizer</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">(Budget − Transit) / Daily Ground</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Your Trip Budget</span>
                <span className="text-lg font-bold text-teal-600">${userBudget}</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Est. Transit Cost</span>
                <span className="text-lg font-bold text-rose-500">${transitCostEstimate}</span>
              </div>

              <div className="p-3 rounded-xl bg-orange-500 border border-orange-500">
                <span className="text-orange-100 block text-[10px]">Affordable Ground Stay</span>
                <span className="text-lg font-bold text-white">{affordableDays} Days Stay</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 text-center font-medium pt-1">
              💡 For <span className="text-teal-700 font-bold">${userBudget}</span> total budget, you can comfortably spend{' '}
              <span className="text-orange-700 font-bold">{affordableDays} days</span> in {dest.name}.
            </p>
          </div>

          {/* Section 7: Getting There */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-rose-500" />
              <span>Getting There</span>
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span className="font-bold text-slate-800">{dest.quickStats.transitHours} hrs</span>
                <span className="text-slate-400">typical door-to-door from a major metro</span>
                <span className="ml-auto px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px]">
                  Transit cost tier: {effectiveTransitTier}
                  {constraints.originCity ? ` (from ${constraints.originCity})` : ' (add origin for a sharper estimate)'}
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <span className="font-semibold shrink-0">{describeTransitMode(dest.quickStats.primaryMode)}:</span>
                <span>{dest.quickStats.nearestAccess}</span>
              </div>
              {/* Domestic-India equivalent of the old visa note — permits, not passports */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Some regions (Ladakh, Sikkim, the Andamans, parts of the Northeast) require an Inner Line
                  Permit or similar clearance, and rules change seasonally — check the state tourism portal
                  before you lock in dates.
                </p>
              </div>
            </div>
          </div>

          {/* Section 8: Why You'll Love It vs What to Know (Honest Cons - TC-603) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why You'll Love It */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <h4 className="font-bold text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Why You&apos;ll Love It</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {dest.whyYouWillLoveIt.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Know (Honest Drawbacks) */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <h4 className="font-bold text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>What to Know (Honest Downsides)</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {dest.whatToKnow.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 9: Mandatory Hidden Financial Burden Warnings (TC-704) */}
          {dest.hiddenFees && dest.hiddenFees.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Hidden Financial Burden Warnings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {dest.hiddenFees.map((fee, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{fee.title}</span>
                      <span className="text-rose-500 font-mono">{fee.amount}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{fee.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 10: Curated Experience Highlights (5-8 cards) */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-slate-900">Curated Experience Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {dest.experienceHighlights.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl glass-card border border-slate-200 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                    {exp.category}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{exp.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 11: Stale Data Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Factual data last verified against Layer 1 KB: {dest.lastVerifiedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
