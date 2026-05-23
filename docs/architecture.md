# Architecture — AI Email Client

## Overview
AI-first universal email client as a mobile-ready PWA. Two separate repos:
- **Frontend**: Next.js 16 PWA deployed on Vercel
- **Backend**: Node.js Express API deployed on Railway + PostgreSQL

---

## System Diagram

```
┌──────────────────────────────────────────────────────┐
│              Browser / Mobile PWA                    │
│     Next.js 16 App Router + Tailwind CSS             │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Sidebar  │ │EmailList │ │    EmailDetail        │ │
│  │ Accounts │ │Paginated │ │  + AI Panel           │ │
│  │ Folders  │ │Unified   │ │  + Label Picker       │ │
│  │ Labels   │ │Inbox     │ │  Reply / Forward      │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│                                                      │
│         Zustand Store (emailStore.ts)                │
│         API Client (lib/api.ts + lib/auth.ts)        │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS + Bearer JWT
                       │ httpOnly cookie (refresh token)
┌──────────────────────▼───────────────────────────────┐
│           Express API (Node.js + TypeScript)         │
│                                                      │
│  ── Auth (public) ──────────────────────────────     │
│  GET  /api/v1/auth/google                            │
│  GET  /api/v1/auth/google/callback                   │
│  GET  /api/v1/auth/microsoft                         │
│  GET  /api/v1/auth/microsoft/callback                │
│  POST /api/v1/auth/refresh                           │
│  POST /api/v1/auth/logout                            │
│                                                      │
│  ── Protected (JWT required) ───────────────────     │
│  GET  /api/v1/emails                                 │
│  GET  /api/v1/emails/more                            │
│  GET  /api/v1/emails/search                          │
│  POST /api/v1/emails/send                            │
│  POST /api/v1/emails/:id/archive                     │
│  POST /api/v1/emails/:id/delete                      │
│  POST /api/v1/emails/:id/read                        │
│  GET  /api/v1/accounts                               │
│  POST /api/v1/accounts                               │
│  DEL  /api/v1/accounts/:id                           │
│  POST /api/v1/ai/summarize   (SSE)                   │
│  POST /api/v1/ai/draft-reply (SSE)                   │
│  POST /api/v1/ai/prioritize                          │
│  POST /api/v1/ai/label                               │
│                                                      │
│  ┌──────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │ GmailService │ │Office365Svc   │ │  AIService  │ │
│  └──────┬───────┘ └──────┬────────┘ └──────┬──────┘ │
└─────────┼────────────────┼─────────────────┼─────────┘
          │                │                 │
    Gmail API       MS Graph API        Groq LLM
   (OAuth 2.0)    (OAuth 2.0)      (llama-3.3-70b)
                                    via groq-sdk
          │                │
    ┌─────▼────────────────▼──────┐
    │     PostgreSQL (Railway)    │
    │  accounts (+ user_id)       │
    │  tokens, refresh_tokens     │
    │  email_labels (+ user_id)   │
    └─────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend framework | Next.js 16 | SSR + PWA + zero-config Vercel deploy |
| State management | Zustand | Lightweight, no boilerplate |
| Email providers | Gmail API + Office 365 Graph API | Best native APIs per provider |
| AI model | Groq llama-3.3-70b | Fast inference, free tier |
| AI streaming | SSE (Server-Sent Events) | Real-time streaming without WebSocket complexity |
| Styling | Tailwind CSS | Fast mobile-first development |
| Auth (API) | JWT access token (15min) + httpOnly refresh token (7 days) | Secure, stateless, silent refresh |
| Auth (email) | OAuth 2.0 per provider | Industry standard, no password storage |
| Multi-user isolation | user_id column on accounts + email_labels | Each user only sees their own data |
| Database | PostgreSQL on Railway | Persistent across deploys, free tier |
| Email loading | First 50 immediate + background chunks | Fast perceived load time |

---

## Authentication & User Isolation Flow

```
User clicks "Add Gmail"
  → GET /auth/google → Google OAuth consent screen
  → Google → GET /auth/google/callback
    → Fetch user email from Google (e.g. you@gmail.com)
    → Issue JWT: { sub: "you@gmail.com" } (15min)
    → Issue refresh token stored in DB with user_id = "you@gmail.com" (7 days, httpOnly cookie)
    → Redirects to /auth/callback?token=<jwt>
  → Frontend stores JWT in localStorage
  → Every API request: Authorization: Bearer <jwt>
    → Middleware: jwt.verify() → req.userId = "you@gmail.com"
    → All DB/cache queries filtered by req.userId
  → On 401: POST /auth/refresh (sends cookie)
    → Looks up refresh_tokens row → reads user_id → issues new JWT with same sub
    → Frontend retries request with new token
```

### User Isolation

Every protected endpoint extracts `req.userId` from the JWT `sub` claim and scopes all data to it:

| Data | Isolation mechanism |
|------|---------------------|
| Accounts | In-memory filter: `accounts.filter(a => a.userId === req.userId)` |
| Emails | Fetched only from the user's own accounts |
| Labels | `WHERE user_id = $1` on all `email_labels` queries |
| Refresh tokens | `user_id` column — re-issued JWT always carries the same user identity |

A user who connects their own Gmail account gets a JWT with their email as `sub`. They can never see accounts, emails, or labels belonging to a different `sub`.

---

## AI Features

All AI features use **Groq API** (llama-3.3-70b-versatile):

| Feature | Endpoint | Method |
|---------|----------|--------|
| Email Summary | POST /ai/summarize | SSE streaming |
| Draft Reply | POST /ai/draft-reply | SSE streaming |
| Priority Score | POST /ai/prioritize | JSON (1-10 score) |
| Auto Label | POST /ai/label | JSON (category name) |

**Auto-labeling flow:**
```
Emails load
  → Skip already-labeled emails (loaded from DB — never re-classify)
  → First 3 unlabeled emails → Promise.all (parallel Groq calls)
  → Remaining unlabeled → sequential, 2s delay between each (Groq RPM limit)
  → Each label saved to PostgreSQL immediately (persisted across sessions)
  → Progress bar shown in sidebar (labeled / total)
  → Labels: Work, Personal, Urgent, Follow Up, Newsletter, Finance
```

---

## Email Loading Strategy

```
GET /api/v1/emails
  → fetchFirstIds(50) — 1 API call, returns first 50 email IDs
  → fetchEmailsByIds(50 ids) — parallel fetch of email details
  → Return to frontend immediately (~1-2s)
  → Background: fetchAllIds(skip=50) → chunks of 50 → merge into cache
  → Frontend polls /emails/more every 3s until complete
  → Progress indicator: "Loading X of Y..."
```

---

## Multi-Agent Workflow (Claude Code)

| Agent | Responsibility | Tools Used |
|-------|---------------|------------|
| UI Agent | React components, Tailwind layout | Read, Edit, Write |
| API Agent | Express routes, email services | Read, Edit, Bash |
| AI Agent | Groq API, SSE streaming, auto-labeling | Read, Edit |
| Store Agent | Zustand state, polling, label progress | Read, Edit |
| Test Agent | Vitest unit tests (10 backend, 9 frontend) | Bash, Write |

---

## PWA Features

- `public/manifest.json` — app name, icons, theme color
- Installable on iOS/Android via "Add to Home Screen"
- Mobile-first responsive layout (sidebar hides on mobile, bottom nav appears)
- Safe area insets for notched devices

---

## Data Flow: Auto-Labeling

```
loadEmails() completes
  → loadLabels() already ran in parallel → userLabels map populated from DB
  → autoLabelEmails() starts
  → Filter: skip emails already in userLabels map (no re-classification)
  → First 3 unlabeled → Promise.all(labelOne())
      → POST /api/v1/ai/label → Groq → "Work" / "Personal" / etc.
      → addLabel(emailId, label) → optimistic Zustand update + api.saveLabel() to DB
      → Label chip appears on email row and detail view immediately
  → labelingProgress updates → sidebar progress bar animates
  → Remaining unlabeled → sequential, await 2s between each (stays under Groq 30 RPM)
  → labelingProgress set to null → progress bar disappears
  → Next session: all labels already in DB → autoLabelEmails() returns immediately
```
