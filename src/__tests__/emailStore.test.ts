import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEmailStore } from '@/store/emailStore';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    getAccounts: vi.fn().mockResolvedValue([]),
    addAccount: vi.fn().mockResolvedValue({}),
    removeAccount: vi.fn().mockResolvedValue({}),
    getEmails: vi.fn().mockResolvedValue([]),
    getMoreEmails: vi.fn().mockResolvedValue({ emails: [], status: {} }),
    searchEmails: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue({}),
    archiveEmail: vi.fn().mockResolvedValue({}),
    deleteEmail: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockEmail = {
  id: 'email-1',
  accountId: 'gmail-test@gmail.com',
  provider: 'gmail' as const,
  from: { name: 'Alice', email: 'alice@example.com' },
  to: [{ name: 'Bob', email: 'bob@example.com' }],
  subject: 'Test Email',
  body: '<p>Hello</p>',
  bodyText: 'Hello',
  date: new Date().toISOString(),
  read: false,
  starred: false,
  labels: ['INBOX'],
  hasAttachments: false,
};

describe('emailStore — labels', () => {
  beforeEach(() => {
    useEmailStore.setState({
      userLabels: new Map(),
      activeLabel: null,
      emails: [mockEmail],
    });
  });

  it('adds a label to an email', () => {
    useEmailStore.getState().addLabel('email-1', 'Work');
    const labels = useEmailStore.getState().userLabels.get('email-1');
    expect(labels).toContain('Work');
  });

  it('does not add duplicate labels', () => {
    useEmailStore.getState().addLabel('email-1', 'Work');
    useEmailStore.getState().addLabel('email-1', 'Work');
    const labels = useEmailStore.getState().userLabels.get('email-1');
    expect(labels?.filter((l) => l === 'Work').length).toBe(1);
  });

  it('removes a label from an email', () => {
    useEmailStore.getState().addLabel('email-1', 'Work');
    useEmailStore.getState().removeLabel('email-1', 'Work');
    const labels = useEmailStore.getState().userLabels.get('email-1');
    expect(labels).not.toContain('Work');
  });

  it('sets and clears activeLabel', () => {
    useEmailStore.getState().setActiveLabel('Personal');
    expect(useEmailStore.getState().activeLabel).toBe('Personal');
    useEmailStore.getState().setActiveLabel(null);
    expect(useEmailStore.getState().activeLabel).toBeNull();
  });
});

describe('emailStore — accounts', () => {
  beforeEach(() => {
    useEmailStore.setState({ accounts: [], activeAccountId: null });
  });

  it('loads accounts from API', async () => {
    const { api } = await import('@/lib/api');
    (api.getAccounts as any).mockResolvedValueOnce([
      { id: 'gmail-a@a.com', email: 'a@a.com', provider: 'gmail', color: '#ea4335' },
    ]);
    await useEmailStore.getState().loadAccounts();
    expect(useEmailStore.getState().accounts).toHaveLength(1);
  });

  it('sets active account and clears search', () => {
    useEmailStore.setState({ searchResults: [mockEmail] });
    useEmailStore.getState().setActiveAccount('gmail-a@a.com');
    expect(useEmailStore.getState().activeAccountId).toBe('gmail-a@a.com');
    expect(useEmailStore.getState().searchResults).toBeNull();
  });
});

describe('emailStore — compose', () => {
  it('opens compose with data', () => {
    useEmailStore.getState().openCompose({ to: 'test@test.com', subject: 'Hello' });
    expect(useEmailStore.getState().composing).toBe(true);
    expect(useEmailStore.getState().composeData.to).toBe('test@test.com');
  });

  it('closes compose and clears data', () => {
    useEmailStore.getState().openCompose({ to: 'x@x.com' });
    useEmailStore.getState().closeCompose();
    expect(useEmailStore.getState().composing).toBe(false);
    expect(useEmailStore.getState().composeData).toEqual({});
  });
});

describe('emailStore — search', () => {
  it('clears search results and query', () => {
    useEmailStore.setState({ searchQuery: 'hello', searchResults: [mockEmail] });
    useEmailStore.getState().clearSearch();
    expect(useEmailStore.getState().searchQuery).toBe('');
    expect(useEmailStore.getState().searchResults).toBeNull();
  });
});
