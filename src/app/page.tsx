'use client';

import { useEffect, useState } from 'react';
import EmailList from '@/components/EmailList/EmailList';
import EmailDetail from '@/components/EmailDetail/EmailDetail';
import ComposeModal from '@/components/Compose/ComposeModal';
import MobileNav from '@/components/MobileNav/MobileNav';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useEmailStore } from '@/store/emailStore';
import { Menu } from 'lucide-react';

export default function Home() {
  const { loadAccounts, loadEmails, selectedEmail, setSelectedEmail } = useEmailStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadAccounts().then(() => loadEmails());
  }, []);

  const showDetail = !!selectedEmail;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">

      {/* ── DESKTOP LAYOUT (md+) ── */}
      <div className="hidden md:flex w-full h-full">
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`fixed inset-y-0 left-0 z-50 md:relative md:flex transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <Sidebar />
        </div>
        <div className="flex-shrink-0 w-80 flex flex-col border-r border-slate-700/50">
          <EmailList />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmailDetail />
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex md:hidden flex-col w-full h-full">

        {/* Mobile: Email List View */}
        {!showDetail && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/50 safe-top">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-400 active:text-white rounded-xl active:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-bold text-white text-lg">MailAI</span>
              <div className="w-9" />
            </div>

            {/* Email list */}
            <div className="flex-1 overflow-hidden">
              <EmailList />
            </div>

            {/* Bottom nav */}
            <MobileNav />
          </div>
        )}

        {/* Mobile: Email Detail View */}
        {showDetail && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Back bar */}
            <div className="flex items-center gap-3 px-3 py-3 bg-slate-900 border-b border-slate-700/50 safe-top">
              <button
                onClick={() => setSelectedEmail(null)}
                className="flex items-center gap-1 text-indigo-400 active:text-indigo-300 py-1 px-2 rounded-lg active:bg-slate-800"
              >
                <span className="text-lg">‹</span>
                <span className="text-sm font-medium">Inbox</span>
              </button>
            </div>

            {/* Email detail */}
            <div className="flex-1 overflow-hidden">
              <EmailDetail />
            </div>
          </div>
        )}

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-72">
              <Sidebar />
            </div>
          </>
        )}
      </div>

      <ComposeModal />
    </div>
  );
}
