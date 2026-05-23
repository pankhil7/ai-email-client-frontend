'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AccountModalProps {
  onClose: () => void;
}

export default function AccountModal({ onClose }: AccountModalProps) {
  const [provider, setProvider] = useState<'gmail' | 'office365'>('gmail');

  const handleAdd = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    if (provider === 'gmail') {
      window.location.href = `${apiUrl}/api/v1/auth/google`;
    } else {
      window.location.href = `${apiUrl}/api/v1/auth/microsoft`;
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
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Choose your email provider</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gmail' as const, label: 'Gmail', icon: '🔴' },
                { id: 'office365' as const, label: 'Office 365', icon: '🔵' },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setProvider(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    provider === id
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

          {provider === 'gmail' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-300 font-medium mb-1">🔴 Sign in with Google</p>
              <p className="text-xs text-blue-400">You'll be taken to Google to sign in securely. No password is stored.</p>
            </div>
          )}

          {provider === 'office365' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-300 font-medium mb-1">🔵 Sign in with Microsoft</p>
              <p className="text-xs text-blue-400">You'll be taken to Microsoft to sign in securely. No password is stored.</p>
            </div>
          )}
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
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
