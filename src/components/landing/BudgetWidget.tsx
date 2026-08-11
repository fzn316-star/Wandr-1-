'use client';

import React, { useState } from 'react';
import { IndianRupee, Plane } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import { ORIGIN_CITIES, formatINR } from '@/lib/transitMatrix';

// Total trip budget per person, in INR. The currency picker that used to sit here offered
// seven currencies for a knowledge base that is entirely domestic India — it implied a
// conversion the cost engine never performed.
const BUDGET_PRESETS = [15000, 25000, 40000, 60000, 100000, 150000];

export default function BudgetWidget() {
  const { maxBudgetINR, setMaxBudgetINR, constraints, updateConstraints } = useWandrStore();
  const [budgetMode, setBudgetMode] = useState<'preset' | 'custom'>('preset');

  const handleBudgetPreset = (amount: number) => {
    setBudgetMode('preset');
    setMaxBudgetINR(amount);
  };

  return (
    <div className="p-3 rounded-xl bg-white/90 border border-slate-200 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
          <span>Total Trip Budget</span>
          <span className="text-slate-300 font-normal normal-case">(optional, per person)</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BUDGET_PRESETS.map((amount) => {
          const isActive = budgetMode === 'preset' && maxBudgetINR === amount;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => handleBudgetPreset(amount)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {formatINR(amount)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setBudgetMode('custom')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
            budgetMode === 'custom'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          Custom
        </button>
      </div>

      {budgetMode === 'custom' && (
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            aria-label="Total trip budget in rupees"
            min={5000}
            max={300000}
            step={2500}
            value={maxBudgetINR}
            onChange={(e) => setMaxBudgetINR(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-slate-200 accent-orange-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md"
          />
          <span className="text-xs font-bold text-slate-700 min-w-[86px] text-right tabular-nums">
            {formatINR(maxBudgetINR)}
          </span>
        </div>
      )}

      {/* Origin city — optional, sharpens transit cost estimates (Epic 7) */}
      <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Plane className="w-3.5 h-3.5 text-teal-600" />
          <span>Travelling From</span>
          <span className="text-slate-300 font-normal normal-case">(optional — sharpens cost estimates)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ORIGIN_CITIES.map((city) => {
            const isActive = constraints.originCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => updateConstraints({ originCity: isActive ? undefined : city })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  isActive ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
