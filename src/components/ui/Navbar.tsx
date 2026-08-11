'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Bookmark, Clock, PanelLeft, Plus, Link2, Check } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import { hoursUntilExpiry } from '@/lib/sessionStore';
import SavedDrawer from '@/components/drawers/SavedDrawer';
import Sidebar from '@/components/ui/Sidebar';

export default function Navbar() {
  const {
    savedDestinations,
    createNewChat,
    toggleSidebar,
    sessionId,
    sessionExpiresAt,
    ensureSessionId,
    chatMessages,
  } = useWandrStore();
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    ensureSessionId();
  }, [ensureSessionId]);

  const handleNewChat = () => {
    createNewChat();
    router.push('/');
  };

  // FR-5.3.1: the session URL is the whole persistence story in V1 — make it one tap to grab.
  const handleCopySessionLink = async () => {
    if (!sessionId) return;
    const url = `${window.location.origin}/discover/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the URL is still in the address bar
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const hoursLeft = sessionExpiresAt ? hoursUntilExpiry({ expiresAt: sessionExpiresAt }) : 48;
  const hasActiveSession = chatMessages.length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/80 px-4 lg:px-8 py-3 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Actions: Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 text-slate-700 hover:text-indigo-600 transition-colors shadow-sm"
              title="Open Chat History Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Brand Logo -> Starts New Chat & Go Home */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
              title="Click to start a new chat on homepage"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-orange-600 group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-orange-950 to-slate-800 bg-clip-text text-transparent">
                    Wandr
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                    AI V1
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Mood-First Travel Discovery</p>
              </div>
            </button>
          </div>

          {/* Center: Session Status Pill — shows real remaining TTL, not a static label */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-xs text-slate-600 shadow-sm font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{hasActiveSession ? `Session expires in ${hoursLeft}h` : '48h Session Ready'}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-500">{sessionId ? sessionId.slice(0, 8) : '—'}</span>
            {hasActiveSession && (
              <button
                onClick={handleCopySessionLink}
                className="ml-0.5 p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Copy this session's shareable link"
              >
                {linkCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Saved Destinations Button */}
            <button
              onClick={() => setIsSavedDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200/80 text-slate-800 text-sm font-semibold transition-all duration-200 shadow-sm"
              title="View Saved Destinations"
            >
              <Bookmark className={`w-4 h-4 ${savedDestinations.length > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Saved</span>
              {savedDestinations.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {savedDestinations.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar & Saved Drawer */}
      <Sidebar />
      <SavedDrawer isOpen={isSavedDrawerOpen} onClose={() => setIsSavedDrawerOpen(false)} />
    </>
  );
}
