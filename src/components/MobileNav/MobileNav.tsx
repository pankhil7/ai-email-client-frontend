'use client';

import { useEmailStore } from '@/store/emailStore';
import { Inbox, Star, Send, Archive, PenSquare } from 'lucide-react';

const TABS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'archive', label: 'Archive', icon: Archive },
];

export default function MobileNav() {
  const { activeFolder, setActiveFolder, openCompose, emails } = useEmailStore();
  const unread = emails.filter((e) => !e.read).length;

  return (
    <div className="bg-slate-900 border-t border-slate-700/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeFolder === id;
          return (
            <button
              key={id}
              onClick={() => setActiveFolder(id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors relative ${
                isActive ? 'text-indigo-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {id === 'inbox' && unread > 0 && (
                <span className="absolute top-1.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* Compose FAB */}
        <button
          onClick={() => openCompose()}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-slate-500 active:text-slate-300"
        >
          <PenSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Compose</span>
        </button>
      </div>
    </div>
  );
}
