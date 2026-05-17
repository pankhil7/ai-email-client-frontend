# Architecture — AI Email Client

## Overview
AI-first universal email client as a mobile-ready PWA. Two separate repos:
- **Frontend**: Next.js 14 PWA deployed on Vercel
- **Backend**: Node.js Express API deployed on Railway/Render

---

## System Diagram

```
┌──────────────────────────────────────────────┐
│           Browser / Mobile PWA               │
│  Next.js 14 App Router + Tailwind CSS        │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Sidebar  │ │EmailList │ │EmailDetail  │  │
│  │ Accounts │ │Unified   │ │+ AI Panel   │  │
│  │ Folders  │ │Inbox     │ │Reply/Fwd    │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
│         Zustand Store (emailStore.ts)        │
│         API Client (lib/api.ts)              │
└─────────────────┬────────────────────────────┘
                  │ HTTP / SSE
┌─────────────────▼────────────────────────────┐
│         Express API (Node.js + TS)           │
│                                              │
│  /api/v1/emails    /api/v1/ai/summarize      │
│  /api/v1/accounts  /api/v1/ai/draft-reply    │
│                    /api/v1/ai/prioritize      │
│                                              │
│  ┌─────────────┐ ┌────────────┐ ┌─────────┐ │
│  │GmailService │ │ImapService │ │AIService│ │
│  └──────┬──────┘ └─────┬──────┘ └────┬────┘ │
└─────────┼──────────────┼─────────────┼───────┘
          │              │             │
    Gmail API        IMAP/SMTP    Claude API
   (OAuth 2.0)    (imapflow +   (claude-sonnet-4-6)
                   nodemailer)
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend framework | Next.js 14 | SSR + PWA + zero-config Vercel deploy |
| State management | Zustand | Lightweight, no boilerplate |
| Email protocol | Gmail API + IMAP | Gmail = best API; IMAP = universal fallback |
| AI model | claude-sonnet-4-6 | Best balance of speed + quality |
| AI streaming | SSE (Server-Sent Events) | Real-time streaming without WebSocket complexity |
| Styling | Tailwind CSS | Fast mobile-first development |
| Auth | OAuth (Gmail/O365) + password (IMAP) | Standard per-provider approach |

---

## AI Features

All AI features use Claude claude-sonnet-4-6 via the Anthropic SDK:

1. **Email Summary** — 2-3 sentence summary, streamed via SSE
2. **Draft Reply** — Professional reply draft, streamed via SSE
3. **Priority Score** — 1-10 urgency score with label (Low/Medium/High/Critical)

Streaming ensures fast perceived performance — users see output immediately.

---

## Multi-Agent Workflow (Claude Code)

| Agent | Responsibility | Tools Used |
|-------|---------------|------------|
| UI Agent | React components, Tailwind | Read, Edit, Write |
| API Agent | Express routes, email services | Read, Edit, Bash |
| AI Agent | Claude API, streaming SSE | Read, Edit |
| Test Agent | Vitest tests | Bash, Write |

Agents run in parallel on independent modules. The UI Agent and API Agent never touch the same files simultaneously.

---

## PWA Features

- `public/manifest.json` — app name, icons, theme color
- Installable on iOS/Android via "Add to Home Screen"
- Offline: shows cached inbox (future: service worker caching)
- Mobile-first responsive layout (sidebar hides on mobile)

---

## Data Flow: Reading an Email

```
User clicks email
  → emailStore.setSelectedEmail(email)
  → emailStore.markAsRead(email)
    → api.markAsRead(email.id, email.accountId)
      → POST /api/v1/emails/:id/read
        → gmail.markAsRead(accessToken, emailId)
  → EmailDetail renders email
  → User clicks ✨ AI button
  → AIPanel renders
  → User clicks "Summarize"
    → api.streamSummary(subject, body, onChunk)
      → POST /api/v1/ai/summarize (SSE)
        → aiService.summarizeEmailStream()
          → Claude API streams tokens
        → chunks update React state word by word
```
