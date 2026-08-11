'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWandrStore } from '@/store/useWandrStore';
import DestinationCard from '@/components/cards/DestinationCard';
import { TRAVEL_MODE_LABELS } from '@/lib/travelContext';
import { Compass, Sparkles, User, Send, Plus, PanelLeft, X, ThumbsUp, Pencil } from 'lucide-react';

/**
 * Phase 2: text arrives token by token from /api/discover, so a message being
 * streamed is rendered as-is — the simulated reveal below would fight it, replaying
 * from the start on every delta.
 *
 * The simulation is kept only for already-complete messages (a restored session,
 * or the locally-generated replies that still answer questions about session
 * state), so restored conversations don't animate their entire history at once.
 */
function StreamingText({ text, live }: { text: string; live?: boolean }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (live) return;
    setDisplayed('');
    let i = 0;
    const totalTicks = 50;
    const chunkSize = Math.max(1, Math.ceil(text.length / totalTicks));
    const timer = setInterval(() => {
      i += chunkSize;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text, live]);

  return (
    <p className="leading-relaxed whitespace-pre-line">
      {live ? text : displayed}
      {/* A caret while the stream is open — the model reasons for several seconds
          before its first word, and dead air reads as a hang. */}
      {live && <span className="inline-block w-[2px] h-4 ml-0.5 bg-orange-500 animate-pulse align-middle" />}
    </p>
  );
}

export default function ChatContainer() {
  const {
    chatMessages,
    isAiThinking,
    sendChatMessage,
    sendFollowUpAnswer,
    constraints,
    createNewChat,
    toggleSidebar,
    removeNegative,
    confirmStyleReflection,
  } = useWandrStore();
  const router = useRouter();

  const negativePreferences = Array.from(
    new Set([...(constraints.explicitNegatives || []), ...(constraints.implicitNegatives || [])])
  );

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewChat = () => {
    createNewChat();
    router.push('/');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiThinking) return;
    sendChatMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Traveler Mode & Session Header */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/95 border border-slate-200/80 text-xs shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors border border-slate-200"
              title="Open chat sessions history"
            >
              <PanelLeft className="w-4 h-4 text-orange-500" />
              <span>History</span>
            </button>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span className="text-slate-500">Context:</span>
              <span className="font-bold text-slate-800">
                {constraints.travelMode ? TRAVEL_MODE_LABELS[constraints.travelMode] : 'Not specified yet'}
              </span>
              <span className="text-slate-300 font-normal normal-case hidden sm:inline">(auto-detected from chat)</span>
            </div>

            {constraints.originCity && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-500">✈️ Travelling from:</span>
                <span className="font-bold text-slate-800">{constraints.originCity}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold border border-orange-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs hidden sm:inline">Active Session</span>
            </div>
          </div>
        </div>

        {/* Negative Preferences — captured from dismissals & natural language, removable */}
        {negativePreferences.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-semibold shrink-0">Ruled out:</span>
            {negativePreferences.map((neg) => (
              <span
                key={neg}
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold"
              >
                {neg}
                <button
                  type="button"
                  onClick={() => removeNegative(neg)}
                  className="p-0.5 rounded-full hover:bg-rose-200 hover:text-rose-900 transition-colors"
                  title={`Stop ruling out "${neg}"`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="space-y-6">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="space-y-4">
            {/* User Message */}
            {msg.sender === 'user' && (
              <div className="flex justify-end">
                <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 text-white text-sm sm:text-base font-semibold shadow-lg shadow-orange-500/20 space-y-1">
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  <p className="text-[10px] text-orange-50/90 text-right opacity-90 font-medium">{msg.timestamp}</p>
                </div>
              </div>
            )}

            {/* AI Message */}
            {msg.sender === 'ai' && (
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 p-0.5 shrink-0 shadow-md">
                  <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                    <Compass className="w-5 h-5 text-orange-600" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Travel Style Calibration card (FR-3.2.2) — a distinct, confirmable surface
                      rather than a claim buried in prose, so the user can correct it in one tap */}
                  {msg.styleReflection ? (
                    <div className="p-5 rounded-2xl rounded-tl-sm bg-teal-50 border border-teal-300 shadow-lg space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Your travel style, as I understand it</span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-teal-950 leading-relaxed">
                        {msg.styleReflection}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => confirmStyleReflection(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Yes, that&apos;s me</span>
                        </button>
                        <button
                          onClick={() => confirmStyleReflection(false)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Not quite — let me tweak</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* AI Response Text */
                    <div className="glass-panel p-5 rounded-2xl rounded-tl-sm text-slate-900 text-sm sm:text-base font-medium space-y-2 border border-white/90 shadow-xl">
                      <StreamingText text={msg.text} live={msg.isStreaming} />
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1 text-orange-700">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          Grounded in Layer 1 KB (Verified)
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  )}

                  {/* Destination Cards Grid - Expanded to 3 columns on large screens */}
                  {msg.destinations && msg.destinations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {msg.destinations.map((dest, idx) => (
                        <DestinationCard key={dest.id} destination={dest} index={idx} />
                      ))}
                    </div>
                  )}

                  {/* Quick Reply Suggestions Chips (User POV) */}
                  {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 space-y-2.5 shadow-md">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span>Quick Reply Suggestions (Tap to send without typing)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendFollowUpAnswer(q)}
                            className="px-3.5 py-2 rounded-xl bg-orange-50/90 hover:bg-orange-500 text-orange-950 hover:text-white border border-orange-200 text-xs font-bold transition-all hover:scale-[1.02] shadow-sm"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* AI Typing Loader */}
        {isAiThinking && (
          <div className="flex gap-3 items-center text-slate-700 text-xs">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-md">
              <Compass className="w-5 h-5 text-orange-500 animate-spin" />
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel text-slate-800 text-xs font-bold shadow-md">
              <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>Analyzing travel mood & scoring destinations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Permanent Bottom Chat Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-30 shadow-2xl">
        <form
          onSubmit={handleSend}
          className="max-w-6xl mx-auto flex items-center gap-3 bg-slate-50 rounded-2xl p-2.5 border border-slate-200 focus-within:border-orange-400 focus-within:bg-white transition-all shadow-inner"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your next prompt (e.g. Pivot to beach towns under ₹30,000, or ask a question)..."
            disabled={isAiThinking}
            className="flex-1 bg-transparent px-4 py-2 text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isAiThinking}
            className="p-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
