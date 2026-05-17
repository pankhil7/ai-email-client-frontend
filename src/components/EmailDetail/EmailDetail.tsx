'use client';

import { useEmailStore } from '@/store/emailStore';
import { Archive, Trash2, Reply, Forward, MoreHorizontal, X, Star } from 'lucide-react';
import { useState } from 'react';
import AIPanel from '../AI/AIPanel';

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
  const { selectedEmail, setSelectedEmail, archiveEmail, deleteEmail, openCompose } = useEmailStore();
  const [showAI, setShowAI] = useState(false);

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
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-2 rounded-lg transition-colors text-sm font-medium ${
              showAI ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="AI Assistant"
          >
            ✨
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
          {selectedEmail.labels && selectedEmail.labels.filter(l => !['UNREAD', 'INBOX', 'SENT'].includes(l)).length > 0 && (
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {selectedEmail.labels.filter(l => !['UNREAD', 'INBOX', 'SENT'].includes(l)).map((label) => (
                <span key={label} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                  {label}
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
      {showAI && <AIPanel email={selectedEmail} onUseDraft={handleUseDraft} />}

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
