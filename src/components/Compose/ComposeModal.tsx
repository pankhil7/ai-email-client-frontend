'use client';

import { useState, useEffect } from 'react';
import { useEmailStore } from '@/store/emailStore';
import { api } from '@/lib/api';
import { X, Send, Minimize2, ChevronDown } from 'lucide-react';

export default function ComposeModal() {
  const { composing, composeData, closeCompose, accounts } = useEmailStore();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [accountId, setAccountId] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (composing) {
      setTo(composeData.to || '');
      setCc(composeData.cc || '');
      setSubject(composeData.subject || '');
      setBody(composeData.body || '');
      setAccountId(composeData.accountId || accounts[0]?.id || '');
      setError('');
      setMinimized(false);
    }
  }, [composing, composeData, accounts]);

  if (!composing) return null;

  const handleSend = async () => {
    if (!to.trim()) return setError('Recipient is required');
    if (!accountId) return setError('Select an account to send from');

    setSending(true);
    setError('');
    try {
      await api.sendEmail({ accountId, to, cc, subject, body });
      closeCompose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-6 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-3 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-t-xl text-sm font-medium shadow-xl hover:bg-slate-700 transition-colors"
        >
          <span className="truncate max-w-[160px]">{subject || 'New Message'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed z-50 bg-slate-800 border border-slate-700 shadow-2xl flex flex-col
      bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]
      md:bottom-0 md:left-auto md:right-6 md:w-[520px] md:rounded-t-xl md:max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-700 rounded-t-xl">
        <span className="font-semibold text-white text-sm">
          {composeData.replyToId ? 'Reply' : composeData.subject?.startsWith('Fwd:') ? 'Forward' : 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={closeCompose} className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* From */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
          <span className="text-xs text-slate-500 w-12">From</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="flex-1 bg-transparent text-slate-300 text-sm focus:outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} style={{ background: '#1e293b' }}>
                {acc.email} ({acc.provider})
              </option>
            ))}
          </select>
        </div>

        {/* To */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
          <span className="text-xs text-slate-500 w-12">To</span>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setShowCc(!showCc)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cc
          </button>
        </div>

        {/* Cc */}
        {showCc && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
            <span className="text-xs text-slate-500 w-12">Cc</span>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="cc@example.com"
              className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-sm focus:outline-none"
            />
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
          <span className="text-xs text-slate-500 w-12">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-slate-300 placeholder-slate-600 text-sm focus:outline-none"
          />
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          className="flex-1 px-4 py-3 bg-transparent text-slate-300 placeholder-slate-600 text-sm focus:outline-none resize-none min-h-[140px]"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
        {error && <span className="text-xs text-red-400">{error}</span>}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={closeCompose}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
