import { create } from 'zustand';
import { Email, EmailAccount, ComposeData } from '@/types/email';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

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

  // Labels
  userLabels: Map<string, string[]>;
  loadLabels: () => Promise<void>;
  addLabel: (emailId: string, label: string) => Promise<void>;
  removeLabel: (emailId: string, label: string) => Promise<void>;
  activeLabel: string | null;
  setActiveLabel: (label: string | null) => void;
  labelingProgress: { labeled: number; total: number } | null;
  autoLabelEmails: () => Promise<void>;
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
  userLabels: new Map(),
  activeLabel: null,
  labelingProgress: null,

  setActiveAccount: (id) => {
    set({ activeAccountId: id, selectedEmail: null, searchResults: null });
    get().loadEmails();
  },

  addAccount: async (account) => {
    logger.info({ msg: 'Adding account', accountId: account.id, provider: account.provider });
    await api.addAccount(account);
    set((s) => ({ accounts: [...s.accounts, account] }));
    await get().loadEmails();
  },

  removeAccount: async (id) => {
    logger.info({ msg: 'Removing account', accountId: id });
    await api.removeAccount(id);
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      activeAccountId: s.activeAccountId === id ? null : s.activeAccountId,
    }));
    await get().loadEmails();
  },

  loadAccounts: async () => {
    const accounts = await api.getAccounts();
    logger.info({ msg: 'Accounts loaded', count: accounts.length });
    set({ accounts });
  },

  loadEmails: async () => {
    get().stopBackgroundPolling();
    set({ loading: true, loadingProgress: null });
    try {
      logger.debug({ msg: 'Loading emails', accountId: get().activeAccountId });
      const [emails] = await Promise.all([
        api.getEmails(get().activeAccountId || undefined),
        get().loadLabels(),
      ]);
      logger.info({ msg: 'Emails loaded', count: emails.length });
      set({ emails, loading: false });
      get().startBackgroundPolling();
      get().autoLabelEmails();
    } catch (err: any) {
      logger.error({ msg: 'Failed to load emails', err });
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
      } catch (err: any) {
        logger.warn({ msg: 'Background polling failed', err });
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
      logger.debug({ msg: 'Searching emails', query: searchQuery });
      const results = await api.searchEmails(searchQuery, activeAccountId || undefined);
      logger.info({ msg: 'Search complete', count: results.length });
      set({ searchResults: results, loading: false });
    } catch (err: any) {
      logger.error({ msg: 'Search failed', err });
      set({ loading: false });
    }
  },

  clearSearch: () => set({ searchResults: null, searchQuery: '' }),

  openCompose: (data = {}) => set({ composing: true, composeData: data }),
  closeCompose: () => set({ composing: false, composeData: {} }),

  archiveEmail: async (email) => {
    try {
      logger.info({ msg: 'Archiving email', emailId: email.id });
      await api.archiveEmail(email.id, email.accountId);
      set((s) => ({
        emails: s.emails.filter((e) => e.id !== email.id),
        selectedEmail: s.selectedEmail?.id === email.id ? null : s.selectedEmail,
      }));
    } catch (err: any) {
      logger.error({ msg: 'Archive failed', emailId: email.id, err });
      throw err;
    }
  },

  deleteEmail: async (email) => {
    try {
      logger.info({ msg: 'Deleting email', emailId: email.id });
      await api.deleteEmail(email.id, email.accountId);
      set((s) => ({
        emails: s.emails.filter((e) => e.id !== email.id),
        selectedEmail: s.selectedEmail?.id === email.id ? null : s.selectedEmail,
      }));
    } catch (err: any) {
      logger.error({ msg: 'Delete failed', emailId: email.id, err });
      throw err;
    }
  },

  markAsRead: async (email) => {
    try {
      await api.markAsRead(email.id, email.accountId);
      set((s) => ({
        emails: s.emails.map((e) => (e.id === email.id ? { ...e, read: true } : e)),
      }));
    } catch (err: any) {
      logger.warn({ msg: 'Mark as read failed', emailId: email.id, err });
    }
  },

  setActiveFolder: (folder) => set({ activeFolder: folder }),

  autoLabelEmails: async () => {
    const { emails, userLabels } = get();
    if (emails.length === 0) return;

    // Skip emails already labeled in DB
    const unlabeled = emails.filter((e) => !(userLabels.get(e.id)?.length));
    if (unlabeled.length === 0) return;

    const total = unlabeled.length;
    set({ labelingProgress: { labeled: 0, total } });

    const labelOne = async (emailId: string, subject: string, body: string) => {
      try {
        const label = await api.labelEmail(subject, body);
        if (label) await get().addLabel(emailId, label); // persists to DB
      } catch {}
      set((s) => ({
        labelingProgress: s.labelingProgress
          ? { ...s.labelingProgress, labeled: s.labelingProgress.labeled + 1 }
          : null,
      }));
    };

    // First 3 immediately in parallel
    const first3 = unlabeled.slice(0, 3);
    const remaining = unlabeled.slice(3);
    await Promise.all(first3.map((e) => labelOne(e.id, e.subject, e.bodyText)));

    // Rest sequentially with 2s delay to stay under Groq RPM limit
    (async () => {
      for (const e of remaining) {
        await labelOne(e.id, e.subject, e.bodyText);
        await new Promise((r) => setTimeout(r, 2000));
      }
      set({ labelingProgress: null });
    })();
  },

  loadLabels: async () => {
    try {
      const rows = await api.getLabels();
      const map = new Map<string, string[]>();
      rows.forEach(({ email_id, label }) => {
        const existing = map.get(email_id) || [];
        if (!existing.includes(label)) map.set(email_id, [...existing, label]);
      });
      set({ userLabels: map });
      logger.debug({ msg: 'Labels loaded from DB', count: rows.length });
    } catch (err: any) {
      logger.warn({ msg: 'Failed to load labels', err });
    }
  },

  addLabel: async (emailId, label) => {
    set((s) => {
      const updated = new Map(s.userLabels);
      const existing = updated.get(emailId) || [];
      if (!existing.includes(label)) updated.set(emailId, [...existing, label]);
      return { userLabels: updated };
    });
    try {
      await api.saveLabel(emailId, label);
    } catch (err: any) {
      logger.warn({ msg: 'Failed to save label to DB', emailId, label, err });
    }
  },

  removeLabel: async (emailId, label) => {
    set((s) => {
      const updated = new Map(s.userLabels);
      const existing = updated.get(emailId) || [];
      updated.set(emailId, existing.filter((l) => l !== label));
      return { userLabels: updated };
    });
    try {
      await api.deleteLabel(emailId, label);
    } catch (err: any) {
      logger.warn({ msg: 'Failed to delete label from DB', emailId, label, err });
    }
  },

  setActiveLabel: (label) => set({ activeLabel: label }),
}));
