'use client';

import { useEmailStore } from '@/store/emailStore';
import { Email } from '@/types/email';
import { Search, RefreshCw, X, Paperclip } from 'lucide-react';
import { useState, useCallback } from 'react';

const PROVIDER_COLORS: Record<string, string> = {
  gmail: '#ea4335',
  office365: '#0078d4',
  imap: '#9333ea',
};

const PRIORITY_COLORS = ['', '', '', 'text-green-400', 'text-green-400', 'text-yellow-400', 'text-yellow-400', 'text-orange-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

function EmailItem({ email, isSelected, onClick }: { email: Email; isSelected: boolean; onClick: () => void }) {
  const date = new Date(email.date);
  const isToday = new Date().toDateString() === date.toDateString();
  const timeStr = isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-700/30 transition-colors ${
        isSelected ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/50'
      } ${!email.read ? 'bg-slate-800/20' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Provider dot */}
        <div
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: PROVIDER_COLORS[email.provider] || '#64748b' }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-sm truncate ${!email.read ? 'font-semibold text-white' : 'text-slate-300'}`}>
              {email.from.name || email.from.email}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {email.aiPriority && email.aiPriority >= 7 && (
                <span className={`text-xs ${PRIORITY_COLORS[email.aiPriority]}`}>●</span>
              )}
              <span className="text-xs text-slate-500">{timeStr}</span>
            </div>
          </div>

          <div className={`text-sm truncate mb-0.5 ${!email.read ? 'text-slate-200' : 'text-slate-400'}`}>
            {email.subject}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 truncate flex-1">
              {email.aiSummary || email.bodyText?.slice(0, 80) || ''}
            </span>
            {email.hasAttachments && <Paperclip className="w-3 h-3 text-slate-500 flex-shrink-0" />}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function EmailList() {
  const {
    emails, searchResults, searchQuery, selectedEmail, loading,
    setSelectedEmail, markAsRead, search, setSearchQuery, clearSearch, loadEmails
  } = useEmailStore();

  const [searching, setSearching] = useState(false);

  const displayEmails = searchResults ?? emails;

  const handleSelect = useCallback((email: Email) => {
    setSelectedEmail(email);
    if (!email.read) markAsRead(email);
  }, [setSelectedEmail, markAsRead]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    await search();
    setSearching(false);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-slate-900 border-r border-slate-700/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white text-sm">
            {searchResults ? `Results (${searchResults.length})` : `Inbox (${emails.length})`}
          </h2>
          <button
            onClick={loadEmails}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-8 py-2 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {loading && !displayEmails.length ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-slate-700/30">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mt-2 shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-700 rounded shimmer w-2/3" />
                    <div className="h-3 bg-slate-700 rounded shimmer w-full" />
                    <div className="h-2 bg-slate-700/50 rounded shimmer w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <Search className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{searchResults ? 'No results found' : 'No emails'}</p>
          </div>
        ) : (
          <>
            {displayEmails.map((email) => (
              <EmailItem
                key={email.id}
                email={email}
                isSelected={selectedEmail?.id === email.id}
                onClick={() => handleSelect(email)}
              />
            ))}
            {!searchResults && (
              <button
                onClick={() => loadEmails(500)}
                disabled={loading}
                className="w-full py-3 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors border-t border-slate-700/30"
              >
                {loading ? 'Loading...' : `Load more (showing ${displayEmails.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
