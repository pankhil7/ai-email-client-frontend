'use client';

import { useEmailStore } from '@/store/emailStore';
import { Archive, Trash2, Reply, Forward, X, Tag } from 'lucide-react';
import { useState } from 'react';
import AIPanel from '../AI/AIPanel';

const PRESET_LABELS = ['Work', 'Personal', 'Urgent', 'Follow Up', 'Newsletter', 'Finance'];
const LABEL_COLORS: Record<string, string> = {
  Work: 'bg-blue-500/20 text-blue-400',
  Personal: 'bg-green-500/20 text-green-400',
  Urgent: 'bg-red-500/20 text-red-400',
  'Follow Up': 'bg-orange-500/20 text-orange-400',
  Newsletter: 'bg-purple-500/20 text-purple-400',
  Finance: 'bg-yellow-500/20 text-yellow-400',
};

const PROVIDER_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  office365: 'Office 365',
  imap: 'IMAP',
};

const PROVIDER_COLORS: Record<string, string> = {
  gmail: 'bg-red-500/10 text-red-400',
  office365: 'bg-blue-500/10 text-blue-400',
  imap: 'bg-purple-500/10 text-purple-400',
};

export default function EmailDetail() {
  const { selectedEmail, setSelectedEmail, archiveEmail, deleteEmail, openCompose, userLabels, addLabel, removeLabel } = useEmailStore();
  const [showAI, setShowAI] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const emailLabels = selectedEmail ? (userLabels.get(selectedEmail.id) || []) : [];

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Reply className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const date = new Date(selectedEmail.date).toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const handleReply = () => {
    openCompose({
      to: selectedEmail.from.email,
      subject: `Re: ${selectedEmail.subject}`,
      body: `<br/><br/>--- Original Message ---<br/>From: ${selectedEmail.from.name} &lt;${selectedEmail.from.email}&gt;<br/>${selectedEmail.body}`,
      replyToId: selectedEmail.id,
      accountId: selectedEmail.accountId,
    });
  };

  const handleForward = () => {
    openCompose({
      subject: `Fwd: ${selectedEmail.subject}`,
      body: `<br/><br/>--- Forwarded Message ---<br/>From: ${selectedEmail.from.name} &lt;${selectedEmail.from.email}&gt;<br/>${selectedEmail.body}`,
      accountId: selectedEmail.accountId,
    });
  };

  const handleUseDraft = (draft: string) => {
    openCompose({
      to: selectedEmail.from.email,
      subject: `Re: ${selectedEmail.subject}`,
      body: draft,
      replyToId: selectedEmail.id,
      accountId: selectedEmail.accountId,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => archiveEmail(selectedEmail)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteEmail(selectedEmail)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReply}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Forward"
          >
            <Forward className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLabelPicker(!showLabelPicker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                showLabelPicker ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Add label"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Label</span>
            </button>
            {showLabelPicker && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 min-w-[160px]">
                {PRESET_LABELS.map((label) => {
                  const active = emailLabels.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={async () => {
                        active ? await removeLabel(selectedEmail!.id, label) : await addLabel(selectedEmail!.id, label);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                        active ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                      {active && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
              showAI ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
          >
            ✨ <span>AI Help</span>
          </button>
        </div>

        <button
          onClick={() => setSelectedEmail(null)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          {/* Subject */}
          <h1 className="text-xl font-bold text-white mb-4 leading-tight">
            {selectedEmail.subject}
          </h1>

          {/* Meta */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(selectedEmail.from.name || selectedEmail.from.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">
                  {selectedEmail.from.name || selectedEmail.from.email}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedEmail.from.email}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  To: {selectedEmail.to.map((t) => t.email).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${PROVIDER_COLORS[selectedEmail.provider]}`}>
                {PROVIDER_LABELS[selectedEmail.provider]}
              </span>
              <span className="text-xs text-slate-500">{date}</span>
            </div>
          </div>

          {/* Labels */}
          {emailLabels.length > 0 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {emailLabels.map((label) => (
                <span
                  key={label}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${LABEL_COLORS[label] || 'bg-slate-700 text-slate-300'}`}
                >
                  {label}
                  <button onClick={async () => await removeLabel(selectedEmail.id, label)} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div
            className="email-body text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.bodyText }}
          />
        </div>
      </div>

      {/* AI Panel */}
      {showAI && <AIPanel email={selectedEmail} onUseDraft={handleUseDraft} onClose={() => setShowAI(false)} />}

      {/* Quick Actions */}
      <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-900/30 flex gap-2">
        <button
          onClick={handleReply}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Reply className="w-4 h-4" />
          Reply
        </button>
        <button
          onClick={handleForward}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <Forward className="w-4 h-4" />
          Forward
        </button>
      </div>
    </div>
  );
}
