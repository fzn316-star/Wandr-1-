'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, Compass, Bookmark, X, Clock, Trash2 } from 'lucide-react';
import { useWandrStore } from '@/store/useWandrStore';
import { hoursUntilExpiry } from '@/lib/sessionStore';

export default function Sidebar() {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    liveSessions,
    refreshLiveSessions,
    sessionId,
    createNewChat,
    deleteSessionById,
    savedDestinations,
  } = useWandrStore();
  const router = useRouter();

  // Sessions are read from storage rather than kept in memory, so the list reflects real
  // TTL state — an expired session is swept out instead of being offered and then bouncing.
  useEffect(() => {
    if (isSidebarOpen) refreshLiveSessions();
  }, [isSidebarOpen, refreshLiveSessions]);

  if (!isSidebarOpen) return null;

  const handleOpenSession = (id: string) => {
    setIsSidebarOpen(false);
    router.push(`/discover/${id}`);
  };

  const handleNewChat = () => {
    createNewChat();
    setIsSidebarOpen(false);
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Panel */}
      <aside className="relative w-80 bg-white/95 backdrop-blur-2xl border-r border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-300">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <span className="font-bold text-base text-slate-900">Wandr Sessions</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Start New Chat</span>
          </button>
        </div>

        {/* Recent Chat Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recent Conversations
          </div>

          {liveSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              No previous chats yet. Type a mood on the homepage to start one!
            </div>
          ) : (
            liveSessions.map((session) => {
              const isActive = session.sessionId === sessionId;
              const hoursLeft = hoursUntilExpiry(session);
              return (
                <div
                  key={session.sessionId}
                  className={`w-full p-3 rounded-xl flex items-start gap-3 transition-all group ${
                    isActive
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-950 font-bold'
                      : 'hover:bg-slate-100 text-slate-700 border border-transparent font-medium'
                  }`}
                >
                  <button
                    onClick={() => handleOpenSession(session.sessionId)}
                    className="flex-1 min-w-0 flex items-start gap-3 text-left"
                  >
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{session.title || 'Trip Discovery'}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Expires in {hoursLeft}h
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteSessionById(session.sessionId)}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete this session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2 font-medium">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              Saved Places:
            </span>
            <span className="font-bold text-slate-900">{savedDestinations.length}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>48h session auto-persistence active</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
