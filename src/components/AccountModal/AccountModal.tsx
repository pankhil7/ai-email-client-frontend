'use client';

import { useState } from 'react';
import { useEmailStore } from '@/store/emailStore';
import { X } from 'lucide-react';
import { EmailProvider } from '@/types/email';

const ACCOUNT_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#84cc16'];

interface AccountModalProps {
  onClose: () => void;
}

export default function AccountModal({ onClose }: AccountModalProps) {
  const { addAccount } = useEmailStore();
  const [provider, setProvider] = useState<EmailProvider>('gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const getDefaultImap = (providerType: string) => {
    if (providerType === 'yahoo') return { host: 'imap.mail.yahoo.com', port: 993 };
    if (providerType === 'aol') return { host: 'imap.aol.com', port: 993 };
    return { host: '', port: 993 };
  };

  const handleProviderChange = (p: string) => {
    if (p === 'yahoo' || p === 'aol') {
      const defaults = getDefaultImap(p);
      setImapHost(defaults.host);
      setImapPort(defaults.port);
      setProvider('imap');
    } else {
      setProvider(p as EmailProvider);
    }
  };

  const handleAdd = async () => {
    // Gmail — redirect to OAuth
    if (provider === 'gmail') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      window.location.href = `${apiUrl}/api/v1/auth/google`;
      return;
    }

    if (!email.trim()) return setError('Email is required');
    if (provider === 'imap' && !password.trim()) return setError('Password is required for IMAP');

    setAdding(true);
    setError('');

    try {
      const id = `${provider}-${Date.now()}`;
      const color = ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];

      await addAccount({
        id,
        email,
        provider,
        color,
        ...(provider === 'imap' && { imapHost, imapPort, imapPassword: password }),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add account');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white text-lg">Add Email Account</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gmail', label: 'Gmail', icon: '🔴' },
                { id: 'office365', label: 'Office 365', icon: '🔵' },
                { id: 'yahoo', label: 'Yahoo Mail', icon: '🟣' },
                { id: 'aol', label: 'AOL Mail', icon: '🟡' },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => handleProviderChange(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    (provider === id) || (id === 'yahoo' && provider === 'imap' && imapHost.includes('yahoo')) || (id === 'aol' && provider === 'imap' && imapHost.includes('aol'))
                      ? 'border-indigo-500 bg-indigo-600/10 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* IMAP Fields */}
          {provider === 'imap' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">IMAP Host</label>
                  <input
                    type="text"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    placeholder="imap.example.com"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Port</label>
                  <input
                    type="number"
                    value={imapPort}
                    onChange={(e) => setImapPort(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Password / App Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="App-specific password recommended"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1.5">Use an app-specific password for better security.</p>
              </div>
            </>
          )}

          {provider === 'gmail' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-400">Gmail requires OAuth. After adding, you'll be redirected to sign in with Google.</p>
            </div>
          )}

          {provider === 'office365' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-400">Office 365 requires Microsoft OAuth. After adding, you'll be redirected to sign in with Microsoft.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            {adding ? 'Adding...' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
