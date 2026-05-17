import { create } from 'zustand';
import { Email, EmailAccount, ComposeData } from '@/types/email';
import { api } from '@/lib/api';

interface EmailStore {
  // Accounts
  accounts: EmailAccount[];
  activeAccountId: string | null;
  setActiveAccount: (id: string | null) => void;
  addAccount: (account: EmailAccount) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  loadAccounts: () => Promise<void>;

  // Emails
  emails: Email[];
  loading: boolean;
  selectedEmail: Email | null;
  setSelectedEmail: (email: Email | null) => void;
  loadEmails: () => Promise<void>;

  // Search
  searchQuery: string;
  searchResults: Email[] | null;
  setSearchQuery: (q: string) => void;
  search: () => Promise<void>;
  clearSearch: () => void;

  // Compose
  composing: boolean;
  composeData: Partial<ComposeData>;
  openCompose: (data?: Partial<ComposeData>) => void;
  closeCompose: () => void;

  // Actions
  archiveEmail: (email: Email) => Promise<void>;
  deleteEmail: (email: Email) => Promise<void>;
  markAsRead: (email: Email) => Promise<void>;

  // Folder
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  accounts: [],
  activeAccountId: null,
  emails: [],
  loading: false,
  selectedEmail: null,
  searchQuery: '',
  searchResults: null,
  composing: false,
  composeData: {},
  activeFolder: 'inbox',

  setActiveAccount: (id) => {
    set({ activeAccountId: id, selectedEmail: null, searchResults: null });
    get().loadEmails();
  },

  addAccount: async (account) => {
    await api.addAccount(account);
    set((s) => ({ accounts: [...s.accounts, account] }));
    await get().loadEmails();
  },

  removeAccount: async (id) => {
    await api.removeAccount(id);
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      activeAccountId: s.activeAccountId === id ? null : s.activeAccountId,
    }));
    await get().loadEmails();
  },

  loadAccounts: async () => {
    const accounts = await api.getAccounts();
    set({ accounts });
  },

  loadEmails: async () => {
    set({ loading: true });
    try {
      const emails = await api.getEmails(get().activeAccountId || undefined);
      set({ emails, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setSelectedEmail: (email) => set({ selectedEmail: email }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  search: async () => {
    const { searchQuery, activeAccountId } = get();
    if (!searchQuery.trim()) return get().clearSearch();
    set({ loading: true });
    try {
      const results = await api.searchEmails(searchQuery, activeAccountId || undefined);
      set({ searchResults: results, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  clearSearch: () => set({ searchResults: null, searchQuery: '' }),

  openCompose: (data = {}) => set({ composing: true, composeData: data }),
  closeCompose: () => set({ composing: false, composeData: {} }),

  archiveEmail: async (email) => {
    await api.archiveEmail(email.id, email.accountId);
    set((s) => ({
      emails: s.emails.filter((e) => e.id !== email.id),
      selectedEmail: s.selectedEmail?.id === email.id ? null : s.selectedEmail,
    }));
  },

  deleteEmail: async (email) => {
    await api.deleteEmail(email.id, email.accountId);
    set((s) => ({
      emails: s.emails.filter((e) => e.id !== email.id),
      selectedEmail: s.selectedEmail?.id === email.id ? null : s.selectedEmail,
    }));
  },

  markAsRead: async (email) => {
    await api.markAsRead(email.id, email.accountId);
    set((s) => ({
      emails: s.emails.map((e) => (e.id === email.id ? { ...e, read: true } : e)),
    }));
  },

  setActiveFolder: (folder) => set({ activeFolder: folder }),
}));
