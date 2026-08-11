'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import MoodHero from '@/components/landing/MoodHero';

export default function Home() {
  const { expiredSessionNotice, clearExpiredSessionNotice } = useWandrStore();

  return (
    <div className="flex-1 flex flex-col">
      {/* TC-505: an expired session lands here with an explanation, not a blank page */}
      {expiredSessionNotice && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-bold text-amber-900">Your previous session has expired.</p>
              <p className="text-amber-800 font-medium mt-0.5">
                Discovery sessions last 48 hours. Let me help you start a fresh one — your saved places are
                still here.
              </p>
            </div>
            <button
              type="button"
              onClick={clearExpiredSessionNotice}
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <MoodHero />
    </div>
  );
}
