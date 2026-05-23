'use client';

import { useState } from 'react';
import { Email } from '@/types/email';
import { api } from '@/lib/api';
import { Loader2, X } from 'lucide-react';
import logger from '@/lib/logger';

interface AIPanelProps {
  email: Email;
  onUseDraft: (draft: string) => void;
  onClose: () => void;
}

const PRIORITY_CONFIG: Record<string, { emoji: string; heading: string; message: string; color: string }> = {
  critical: { emoji: '🔴', heading: 'Needs immediate attention', message: 'This email is urgent — reply as soon as possible.', color: 'border-red-500/30 bg-red-500/5' },
  high:     { emoji: '🟠', heading: 'Reply soon', message: "This looks important. Try to get back to them today.", color: 'border-orange-500/30 bg-orange-500/5' },
  medium:   { emoji: '🟡', heading: 'Reply when you can', message: "Not urgent, but worth responding to in the next day or two.", color: 'border-yellow-500/30 bg-yellow-500/5' },
  low:      { emoji: '🟢', heading: 'No rush', message: "Low priority — reply whenever it suits you.", color: 'border-green-500/30 bg-green-500/5' },
};

function getPriorityKey(score: number) {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export default function AIPanel({ email, onUseDraft, onClose }: AIPanelProps) {
  const [summary, setSummary] = useState('');
  const [draft, setDraft] = useState('');
  const [priorityKey, setPriorityKey] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);

  const handleSummarize = async () => {
    setSummary('');
    setLoadingSummary(true);
    try {
      logger.info({ msg: 'AI summarize started', emailId: email.id });
      await api.streamSummary(email.subject, email.bodyText, (chunk) => {
        setSummary((prev) => prev + chunk);
      });
      logger.debug({ msg: 'AI summarize complete', emailId: email.id });
    } catch (err: any) {
      logger.error({ msg: 'AI summarize failed', emailId: email.id, error: err.message });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDraftReply = async () => {
    setDraft('');
    setLoadingDraft(true);
    try {
      logger.info({ msg: 'AI draft reply started', emailId: email.id });
      await api.streamDraftReply(email.subject, email.bodyText, email.from.name, (chunk) => {
        setDraft((prev) => prev + chunk);
      });
      logger.debug({ msg: 'AI draft reply complete', emailId: email.id });
    } catch (err: any) {
      logger.error({ msg: 'AI draft reply failed', emailId: email.id, error: err.message });
    } finally {
      setLoadingDraft(false);
    }
  };

  const handlePrioritize = async () => {
    setLoadingPriority(true);
    try {
      logger.info({ msg: 'AI prioritize started', emailId: email.id });
      const score = await api.prioritizeEmail(email.subject, email.bodyText, email.from.email);
      logger.info({ msg: 'AI prioritize complete', emailId: email.id, score });
      setPriorityKey(getPriorityKey(score));
    } catch (err: any) {
      logger.error({ msg: 'AI prioritize failed', emailId: email.id, error: err.message });
    } finally {
      setLoadingPriority(false);
    }
  };

  const priority = priorityKey ? PRIORITY_CONFIG[priorityKey] : null;

  return (
    <div className="border-t border-slate-700/50 bg-slate-900 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <span className="text-sm font-semibold text-white">AI Assistant</span>
          <span className="text-xs text-slate-500">— What would you like help with?</span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleSummarize}
          disabled={loadingSummary}
          className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-colors disabled:opacity-50 text-left"
        >
          <span className="text-lg">📋</span>
          <span className="text-xs font-semibold text-white">
            {loadingSummary ? 'Summarising…' : 'Quick Summary'}
          </span>
          <span className="text-[10px] text-slate-500 leading-tight">Get the key points in seconds</span>
          {loadingSummary && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 mt-0.5" />}
        </button>

        <button
          onClick={handleDraftReply}
          disabled={loadingDraft}
          className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-colors disabled:opacity-50 text-left"
        >
          <span className="text-lg">✍️</span>
          <span className="text-xs font-semibold text-white">
            {loadingDraft ? 'Writing…' : 'Write My Reply'}
          </span>
          <span className="text-[10px] text-slate-500 leading-tight">AI drafts a reply for you</span>
          {loadingDraft && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 mt-0.5" />}
        </button>

        <button
          onClick={handlePrioritize}
          disabled={loadingPriority}
          className="flex flex-col items-start gap-1 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-colors disabled:opacity-50 text-left"
        >
          <span className="text-lg">⏰</span>
          <span className="text-xs font-semibold text-white">
            {loadingPriority ? 'Checking…' : 'How Urgent?'}
          </span>
          <span className="text-[10px] text-slate-500 leading-tight">Find out if it needs a quick reply</span>
          {loadingPriority && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 mt-0.5" />}
        </button>
      </div>

      {/* Priority Result */}
      {priority && (
        <div className={`fade-in rounded-xl p-3 border ${priority.color}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base">{priority.emoji}</span>
            <span className="text-sm font-semibold text-white">{priority.heading}</span>
          </div>
          <p className="text-xs text-slate-400 ml-7">{priority.message}</p>
        </div>
      )}

      {/* Summary Result */}
      {(summary || loadingSummary) && (
        <div className="fade-in rounded-xl p-3 border border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📋</span>
            <span className="text-xs font-semibold text-slate-300">Here's what this email is about</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary}
            {loadingSummary && <span className="animate-pulse ml-0.5">|</span>}
          </p>
        </div>
      )}

      {/* Draft Result */}
      {(draft || loadingDraft) && (
        <div className="fade-in rounded-xl p-3 border border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">✍️</span>
              <span className="text-xs font-semibold text-indigo-300">Here's a draft reply for you</span>
            </div>
            {draft && !loadingDraft && (
              <button
                onClick={() => onUseDraft(draft)}
                className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
              >
                Use this →
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {draft}
            {loadingDraft && <span className="animate-pulse ml-0.5">|</span>}
          </p>
        </div>
      )}
    </div>
  );
}
