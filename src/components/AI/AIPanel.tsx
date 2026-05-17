'use client';

import { useState } from 'react';
import { Email } from '@/types/email';
import { api } from '@/lib/api';
import { Sparkles, FileText, Reply, Zap, Loader2 } from 'lucide-react';

interface AIPanelProps {
  email: Email;
  onUseDraft: (draft: string) => void;
}

export default function AIPanel({ email, onUseDraft }: AIPanelProps) {
  const [summary, setSummary] = useState('');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<number | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);

  const handleSummarize = async () => {
    setSummary('');
    setLoadingSummary(true);
    await api.streamSummary(email.subject, email.bodyText, (chunk) => {
      setSummary((prev) => prev + chunk);
    });
    setLoadingSummary(false);
  };

  const handleDraftReply = async () => {
    setDraft('');
    setLoadingDraft(true);
    await api.streamDraftReply(email.subject, email.bodyText, email.from.name, (chunk) => {
      setDraft((prev) => prev + chunk);
    });
    setLoadingDraft(false);
  };

  const handlePrioritize = async () => {
    setLoadingPriority(true);
    const score = await api.prioritizeEmail(email.subject, email.bodyText, email.from.email);
    setPriority(score);
    setLoadingPriority(false);
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 9) return { label: 'Critical', color: 'text-red-400 bg-red-400/10' };
    if (score >= 7) return { label: 'High', color: 'text-orange-400 bg-orange-400/10' };
    if (score >= 5) return { label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10' };
    return { label: 'Low', color: 'text-green-400 bg-green-400/10' };
  };

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-indigo-400">AI Assistant</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSummarize}
          disabled={loadingSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {loadingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          Summarize
        </button>

        <button
          onClick={handleDraftReply}
          disabled={loadingDraft}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {loadingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Reply className="w-3 h-3" />}
          Draft Reply
        </button>

        <button
          onClick={handlePrioritize}
          disabled={loadingPriority}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        >
          {loadingPriority ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Prioritize
        </button>
      </div>

      {/* Priority Badge */}
      {priority !== null && (
        <div className="fade-in">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getPriorityLabel(priority).color}`}>
            <Zap className="w-3.5 h-3.5" />
            Priority: {getPriorityLabel(priority).label} ({priority}/10)
          </div>
        </div>
      )}

      {/* Summary */}
      {(summary || loadingSummary) && (
        <div className="fade-in bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Summary</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary}
            {loadingSummary && <span className="animate-pulse">|</span>}
          </p>
        </div>
      )}

      {/* Draft Reply */}
      {(draft || loadingDraft) && (
        <div className="fade-in bg-slate-800/50 rounded-lg p-3 border border-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Reply className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Draft Reply</span>
            </div>
            {draft && !loadingDraft && (
              <button
                onClick={() => onUseDraft(draft)}
                className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
              >
                Use Draft
              </button>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {draft}
            {loadingDraft && <span className="animate-pulse">|</span>}
          </p>
        </div>
      )}
    </div>
  );
}
