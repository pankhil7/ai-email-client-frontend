import { getAccessToken, refreshAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Authenticated fetch — adds JWT header, silently refreshes on 401, retries once
async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = {
    ...init.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(input, { ...init, headers, credentials: 'include' });

  if (res.status === 401) {
    // Try silent refresh
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = { ...init.headers, Authorization: `Bearer ${newToken}` };
      return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' });
    }
  }

  return res;
}

export const api = {
  async getEmails(accountId?: string) {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    const res = await authFetch(`${API_URL}/api/v1/emails?${params}`);
    if (!res.ok) throw new Error('Failed to fetch emails');
    return res.json();
  },

  async searchEmails(query: string, accountId?: string) {
    const params = new URLSearchParams({ query });
    if (accountId) params.set('accountId', accountId);
    const res = await authFetch(`${API_URL}/api/v1/emails/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async sendEmail(payload: object) {
    const res = await authFetch(`${API_URL}/api/v1/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  },

  async archiveEmail(emailId: string, accountId: string) {
    const res = await authFetch(`${API_URL}/api/v1/emails/${emailId}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    return res.json();
  },

  async deleteEmail(emailId: string, accountId: string) {
    const res = await authFetch(`${API_URL}/api/v1/emails/${emailId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    return res.json();
  },

  async markAsRead(emailId: string, accountId: string) {
    const res = await authFetch(`${API_URL}/api/v1/emails/${emailId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    return res.json();
  },

  async getAccounts() {
    const res = await authFetch(`${API_URL}/api/v1/accounts`);
    if (!res.ok) return [];
    return res.json();
  },

  async addAccount(account: object) {
    const res = await authFetch(`${API_URL}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    return res.json();
  },

  async removeAccount(accountId: string) {
    const res = await authFetch(`${API_URL}/api/v1/accounts/${accountId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getMoreEmails(offset: number, accountId?: string) {
    const params = new URLSearchParams({ offset: String(offset) });
    if (accountId) params.set('accountId', accountId);
    const res = await authFetch(`${API_URL}/api/v1/emails/more?${params}`);
    if (!res.ok) throw new Error('Failed to fetch more emails');
    return res.json() as Promise<{ emails: any[]; status: Record<string, { loading: boolean; total: number; loaded: number }> }>;
  },

  async getEmailsStatus(accountId?: string) {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    const res = await authFetch(`${API_URL}/api/v1/emails/status?${params}`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json() as Promise<Record<string, { loading: boolean; total: number; loaded: number }>>;
  },

  async streamSummary(subject: string, body: string, onChunk: (text: string) => void) {
    const res = await authFetch(`${API_URL}/api/v1/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
          } catch {}
        }
      }
    }
  },

  async streamDraftReply(subject: string, body: string, fromName: string, onChunk: (text: string) => void) {
    const res = await authFetch(`${API_URL}/api/v1/ai/draft-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, fromName }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
          } catch {}
        }
      }
    }
  },

  async prioritizeEmail(subject: string, body: string, from: string): Promise<number> {
    const res = await authFetch(`${API_URL}/api/v1/ai/prioritize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, from }),
    });
    const data = await res.json();
    return data.score;
  },
};
