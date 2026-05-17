'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import EmailList from '@/components/EmailList/EmailList';
import EmailDetail from '@/components/EmailDetail/EmailDetail';
import ComposeModal from '@/components/Compose/ComposeModal';
import { useEmailStore } from '@/store/emailStore';
import { Menu } from 'lucide-react';

export default function Home() {
  const { loadAccounts, loadEmails, selectedEmail } = useEmailStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadAccounts().then(() => loadEmails());
  }, []);

  useEffect(() => {
    if (selectedEmail) setMobileView('detail');
  }, [selectedEmail]);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 md:relative md:flex md:z-auto
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Email List — hidden on mobile when viewing detail */}
      <div className={`
        flex-shrink-0 flex flex-col
        ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
        w-full md:w-80
      `}>
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700/50 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white">Inbox</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <EmailList />
        </div>
      </div>

      {/* Email Detail — full screen on mobile when selected */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Mobile back button */}
        {selectedEmail && (
          <div className="md:hidden flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700/50">
            <button
              onClick={() => setMobileView('list')}
              className="text-indigo-400 text-sm font-medium"
            >
              ← Back
            </button>
            <span className="font-semibold text-white text-sm truncate">{selectedEmail.subject}</span>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <EmailDetail />
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal />
    </div>
  );
}
