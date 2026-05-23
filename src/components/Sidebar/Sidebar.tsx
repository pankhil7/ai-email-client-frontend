'use client';

import { useState } from 'react';
import { useEmailStore } from '@/store/emailStore';
import {
  Inbox, Send, Archive, Trash2, Star, Settings,
  Plus, Mail, ChevronDown, ChevronRight, X, Tag
} from 'lucide-react';

const PRESET_LABELS = ['Work', 'Personal', 'Urgent', 'Follow Up', 'Newsletter', 'Finance'];
const LABEL_COLORS: Record<string, string> = {
  Work: '#3b82f6',
  Personal: '#22c55e',
  Urgent: '#ef4444',
  'Follow Up': '#f97316',
  Newsletter: '#a855f7',
  Finance: '#eab308',
};
import AccountModal from '../AccountModal/AccountModal';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const PROVIDER_COLORS: Record<string, string> = {
  gmail: '#ea4335',
  office365: '#0078d4',
};

export default function Sidebar() {
  const { accounts, activeAccountId, activeFolder, setActiveAccount, setActiveFolder, openCompose, emails, removeAccount, activeLabel, setActiveLabel, labelingProgress, userLabels } = useEmailStore();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountsExpanded, setAccountsExpanded] = useState(true);

  const unreadCount = emails.filter((e) => !e.read).length;

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-slate-900 flex flex-col h-full border-r border-slate-700/50">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">MailAI</span>
          </div>
        </div>

        {/* Compose Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => openCompose()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>
        </div>

        {/* Folders */}
        <nav className="px-2 flex-1 overflow-y-auto">
          <div className="space-y-0.5">
            {FOLDERS.map(({ id, label, icon: Icon }) => {
              const isActive = activeFolder === id && !activeAccountId;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveFolder(id); setActiveAccount(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {id === 'inbox' && unreadCount > 0 && (
                    <span className="bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Labels */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                Labels
              </div>
              {labelingProgress && (
                <span className="text-[10px] text-slate-500">
                  {labelingProgress.labeled}/{labelingProgress.total}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {labelingProgress && (
              <div className="mx-3 mb-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((labelingProgress.labeled / labelingProgress.total) * 100)}%` }}
                />
              </div>
            )}

            <div className="space-y-0.5 mt-1">
              {PRESET_LABELS.map((label) => {
                const count = emails.filter((e) => (userLabels.get(e.id) || []).includes(label)).length;
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setActiveLabel(activeLabel === label ? null : label);
                      setActiveFolder('inbox');
                      setActiveAccount(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeLabel === label
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LABEL_COLORS[label] }} />
                    <span className="flex-1 text-left">{label}</span>
                    {count > 0 && (
                      <span className="text-xs text-slate-500">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accounts */}
          <div className="mt-4">
            <button
              onClick={() => setAccountsExpanded(!accountsExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
            >
              {accountsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Accounts
            </button>

            {accountsExpanded && (
              <div className="space-y-0.5 mt-1">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeAccountId === account.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setActiveAccount(activeAccountId === account.id ? null : account.id)}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: PROVIDER_COLORS[account.provider] || account.color }}
                      >
                        {account.email[0].toUpperCase()}
                      </div>
                      <span className="truncate flex-1 text-left">{account.email}</span>
                      <span className="text-xs text-slate-600 capitalize">{account.provider}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${account.email}?`)) removeAccount(account.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                      title="Remove account"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setShowAccountModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Settings */}
        <div className="px-2 py-3 border-t border-slate-700/50">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} />}
    </>
  );
}
