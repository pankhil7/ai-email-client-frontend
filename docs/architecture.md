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
    │  accounts, tokens,          │
    │  refresh_tokens             │
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
| Database | PostgreSQL on Railway | Persistent across deploys, free tier |
| Email loading | First 50 immediate + background chunks | Fast perceived load time |

---

## Authentication Flow

```
User clicks "Add Gmail"
  → GET /auth/google → Google OAuth consent screen
  → Google → GET /auth/google/callback
    → Backend issues JWT (15min) + refresh token (7 days, httpOnly cookie)
    → Redirects to /auth/callback?token=<jwt>
  → Frontend stores JWT in localStorage
  → Every API request: Authorization: Bearer <jwt>
  → On 401: POST /auth/refresh (sends cookie) → new JWT → retry request
```

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
  → First 10 labeled immediately (parallel API calls)
  → Remaining labeled in background (sequential, 200ms delay)
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
  → autoLabelEmails() starts
  → First 10 emails → Promise.all(labelEmail(subject, body))
      → POST /api/v1/ai/label
        → Groq classifies into Work/Personal/Urgent/etc.
      → addLabel(emailId, label) → Zustand state update
      → Label chip appears on email immediately
  → labelingProgress updates → sidebar progress bar animates
  → Remaining emails → sequential with 200ms delay
  → labelingProgress set to null → progress bar disappears
```
