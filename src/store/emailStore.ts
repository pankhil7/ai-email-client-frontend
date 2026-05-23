import { create } from 'zustand';
import { Email, EmailAccount, ComposeData } from '@/types/email';
import { api } from '@/lib/api';

interface LoadingProgress {
  loading: boolean;
  loaded: number;
  total: number;
}

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
  loadingProgress: LoadingProgress | null;
  selectedEmail: Email | null;
  setSelectedEmail: (email: Email | null) => void;
  loadEmails: () => Promise<void>;
  startBackgroundPolling: () => void;
  stopBackgroundPolling: () => void;

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

let _pollTimer: ReturnType<typeof setTimeout> | null = null;

export const useEmailStore = create<EmailStore>((set, get) => ({
  accounts: [],
  activeAccountId: null,
  emails: [],
  loading: false,
  loadingProgress: null,
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
    get().stopBackgroundPolling();
    set({ loading: true, loadingProgress: null });
    try {
      const emails = await api.getEmails(get().activeAccountId || undefined);
      set({ emails, loading: false });
      // Start polling for background-loaded emails
      get().startBackgroundPolling();
    } catch (err) {
      console.error('Failed to load emails:', err);
      set({ loading: false });
    }
  },

  startBackgroundPolling: () => {
    get().stopBackgroundPolling();

    const poll = async () => {
      const { emails, activeAccountId } = get();
      const offset = emails.length;
      try {
        const { emails: newEmails, status } = await api.getMoreEmails(offset, activeAccountId || undefined);

        // Merge progress info
        const statuses = Object.values(status);
        const anyLoading = statuses.some((s) => s.loading);
        const totalLoaded = statuses.reduce((sum, s) => sum + s.loaded, 0) + 50; // +50 for initial batch
        const totalCount = statuses.reduce((sum, s) => sum + s.total, 0) + 50;

        set((s) => ({
          loadingProgress: anyLoading || totalLoaded < totalCount
            ? { loading: anyLoading, loaded: totalLoaded, total: totalCount }
            : null,
        }));

        if (newEmails.length > 0) {
          set((s) => {
            const existingIds = new Set(s.emails.map((e) => e.id));
            const unique = newEmails.filter((e: Email) => !existingIds.has(e.id));
            if (unique.length === 0) return s;
            const merged = [...s.emails, ...unique].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            return { emails: merged };
          });
        }

        // Keep polling while any account is still loading
        if (anyLoading) {
          _pollTimer = setTimeout(poll, 3000);
        } else {
          set({ loadingProgress: null });
        }
      } catch {
        // silently stop on error
      }
    };

    _pollTimer = setTimeout(poll, 4000); // first poll after 4s (give backend time to load chunk 2)
  },

  stopBackgroundPolling: () => {
    if (_pollTimer !== null) {
      clearTimeout(_pollTimer);
      _pollTimer = null;
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
