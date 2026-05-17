export type EmailProvider = 'gmail' | 'office365' | 'imap';

export interface EmailAccount {
  id: string;
  email: string;
  provider: EmailProvider;
  color: string;
}

export interface Email {
  id: string;
  accountId: string;
  provider: EmailProvider;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  cc?: { name: string; email: string }[];
  subject: string;
  body: string;
  bodyText: string;
  date: string;
  read: boolean;
  starred: boolean;
  labels: string[];
  hasAttachments: boolean;
  threadId?: string;
  aiPriority?: number;
  aiSummary?: string;
}

export interface ComposeData {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  replyToId?: string;
  accountId: string;
}
