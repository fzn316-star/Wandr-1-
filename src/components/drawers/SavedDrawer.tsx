'use client';

import React from 'react';
import { X, Bookmark, Trash2, ExternalLink, Columns, Check } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import { formatINR } from '@/lib/transitMatrix';
import Image from 'next/image';

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedDrawer({ isOpen, onClose }: SavedDrawerProps) {
  const {
    savedDestinations,
    unsaveDestination,
    setActiveDeepDiveDestination,
    setIsComparisonOpen,
    comparisonDestinationIds,
    toggleComparisonSelection,
  } = useWandrStore();

  if (!isOpen) return null;

  const canCompare = comparisonDestinationIds.length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Bookmark className="w-5 h-5 fill-amber-400/30" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Saved Places</h2>
              <p className="text-xs text-slate-500">{savedDestinations.length} destination{savedDestinations.length === 1 ? '' : 's'} in your session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {savedDestinations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bookmark className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">No saved places yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tap the bookmark icon 🔖 on any destination card to save places for your trip.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Compare Selection CTA */}
              {savedDestinations.length >= 2 && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 space-y-2.5">
                  <p className="text-[11px] font-semibold text-orange-800">
                    Tap 2–3 places below to compare them side-by-side.
                  </p>
                  <button
                    disabled={!canCompare}
                    onClick={() => {
                      onClose();
                      setIsComparisonOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                  >
                    <Columns className="w-4 h-4" />
                    <span>
                      {canCompare
                        ? `Compare ${comparisonDestinationIds.length} Selected`
                        : 'Select at least 2 to compare'}
                    </span>
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {savedDestinations.map((dest) => {
                  const isSelected = comparisonDestinationIds.includes(dest.id);
                  return (
                    <div
                      key={dest.id}
                      className={`glass-card rounded-xl overflow-hidden p-3 flex gap-3 group relative border transition-all ${
                        isSelected ? 'border-orange-400 shadow-md shadow-orange-500/10' : 'border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      {/* Comparison Select Toggle */}
                      {savedDestinations.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => toggleComparisonSelection(dest.id)}
                          title={isSelected ? 'Remove from comparison' : 'Add to comparison (max 3)'}
                          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-white/90 border-slate-300 text-transparent hover:border-orange-400'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>
                      )}

                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                        <Image
                          src={dest.heroImageUrl}
                          alt={dest.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{dest.name}</h4>
                            <button
                              onClick={() => unsaveDestination(dest.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-orange-600 font-semibold">{dest.country}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                            {formatINR(dest.quickStats.avgDailyCostINR)}/day
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              setActiveDeepDiveDestination(dest);
                            }}
                            className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                          >
                            <span>Deep-Dive</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
