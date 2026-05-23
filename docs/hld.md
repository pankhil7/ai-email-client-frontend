# High Level Design — AI Email Client

## 1. Problem Statement

Email is one of the most used communication tools, yet most email clients are passive — they display emails but offer no intelligence. Users spend significant time reading, summarising, and responding to emails manually.

**This app solves:**
- Information overload — too many emails, hard to prioritise
- Time wasted writing replies — repetitive, formulaic responses
- Context switching — jumping between Gmail and Office 365 accounts
- No automatic organisation — emails pile up without categorisation

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Unified inbox | View Gmail and Office 365 emails in one place |
| AI-first | Every email has AI assistance available instantly |
| Auto-organisation | Labels applied automatically without user effort |
| Fast load | First 50 emails visible within 1-2 seconds |
| Secure | No unauthorised access to user email data |
| Mobile-ready | Fully usable on phone as a PWA |

## Non-Goals

- Not a full email client replacement (no calendar, contacts, tasks)
- Not a bulk email / marketing tool
- Not storing email content permanently in our database
- Not supporting email encryption (PGP/S-MIME)

---

## 3. System Components

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
│                                                 │
│   PWA (Next.js)    ←→    Zustand Store          │
│   - Inbox view              - Email state       │
│   - AI Panel                - Auth state        │
│   - Compose modal           - Label state       │
│   - Label sidebar           - Loading progress  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
                       │ JWT Bearer Token
                       │ httpOnly Cookie
┌──────────────────────▼──────────────────────────┐
│                   SERVER                        │
│                                                 │
│   Express API (Railway)                         │
│   - Auth routes (public)                        │
│   - Email routes (protected)                    │
│   - AI routes (protected)                       │
│                                                 │
│   Services                                      │
│   - GmailService    → Gmail API                 │
│   - Office365Service → MS Graph API             │
│   - AIService       → Groq LLM                  │
└──────┬───────────────────────────────┬──────────┘
       │                               │
┌──────▼──────┐               ┌────────▼────────┐
│ PostgreSQL  │               │  External APIs  │
│ (Railway)   │               │                 │
│ - accounts  │               │  Gmail API      │
│ - tokens    │               │  MS Graph API   │
│ - refresh   │               │  Groq LLM API   │
│   tokens    │               └─────────────────┘
└─────────────┘
```

---

## 4. Data Flow

### 4.1 User Login (OAuth)

```
User → Click "Add Gmail"
  → Frontend → GET /api/v1/auth/google
  → Backend → Redirect to Google OAuth
  → Google → User grants permission
  → Google → GET /api/v1/auth/google/callback
  → Backend → Exchange code for Gmail tokens
  → Backend → Store tokens in PostgreSQL
  → Backend → Issue JWT (15min) + refresh token (7 days)
  → Backend → Set refresh token as httpOnly cookie
  → Backend → Redirect to frontend with JWT in URL
  → Frontend → Store JWT in localStorage
  → Frontend → Load emails
```

### 4.2 Reading Emails

```
Frontend → GET /api/v1/emails (Authorization: Bearer <jwt>)
  → Backend → Verify JWT
  → Backend → Get fresh Gmail/Office365 access token
  → Backend → Fetch first 50 email IDs (1 API call)
  → Backend → Fetch email details in parallel
  → Backend → Return to frontend (~1-2s)
  → Frontend → Display inbox
  → Background → Fetch remaining emails in chunks of 50
  → Frontend → Poll /emails/more every 3s → merge new emails
```

### 4.3 AI Auto-Labeling

```
Emails loaded
  → Frontend → Auto-label first 10 emails (parallel)
    → POST /api/v1/ai/label { subject, body }
    → Backend → Groq LLM classifies email
    → Backend → Returns label (Work/Personal/Urgent/etc.)
    → Frontend → Apply label → show chip on email
  → Frontend → Label remaining emails in background (sequential)
  → Sidebar → Progress bar updates in real time
```

### 4.4 Token Refresh

```
Frontend → API request → 401 Unauthorized (JWT expired)
  → Frontend → POST /api/v1/auth/refresh (sends httpOnly cookie)
  → Backend → Validate refresh token in PostgreSQL
  → Backend → Issue new JWT (15min)
  → Frontend → Store new JWT → Retry original request
  → User sees nothing — happens silently
```

---

## 5. Security Design

| Threat | Mitigation |
|--------|-----------|
| Unauthorised API access | JWT required on all protected routes |
| JWT theft via XSS | Short 15min expiry limits damage window |
| Refresh token theft | httpOnly cookie — JS cannot read it |
| CORS attacks | Strict CORS origin allowlist |
| Token replay after logout | Refresh token deleted from DB on logout |
| Expired Gmail tokens | Auto-refresh via OAuth refresh token before each request |
| Man-in-the-middle | HTTPS enforced on Railway and Vercel |

---

## 6. Database Design

```
accounts
  id          TEXT PRIMARY KEY   (e.g. "gmail-user@gmail.com")
  email       TEXT
  provider    TEXT               (gmail / office365)
  access_token TEXT
  refresh_token TEXT
  color       TEXT

tokens
  account_id  TEXT PRIMARY KEY
  access_token TEXT
  refresh_token TEXT
  email       TEXT

refresh_tokens
  token       TEXT PRIMARY KEY   (random 40-byte hex)
  created_at  TIMESTAMP
  expires_at  TIMESTAMP          (7 days from issue)
```

**Note:** Email content is never stored in the database. It is fetched on demand from Gmail/Office365 and held in server memory only for the duration of the request.

---

## 7. Scalability Considerations

| Area | Current | Future |
|------|---------|--------|
| Database | Single PostgreSQL on Railway | Read replicas, connection pooling (pgBouncer) |
| Email fetching | Per-request API calls | Redis cache for email content (TTL: 5min) |
| AI labeling | Sequential per email | Batch classification endpoint |
| Auth | Single JWT secret | Key rotation, multi-region secrets |
| Deployment | Single Railway instance | Horizontal scaling with load balancer |

---

## 8. Technology Choices & Trade-offs

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| AI provider | Groq (llama-3.3-70b) | OpenAI GPT-4 | Groq is significantly faster and has a free tier |
| Database | PostgreSQL | MongoDB | Relational model fits accounts/tokens better |
| State management | Zustand | Redux | Less boilerplate, simpler API |
| Deployment | Railway + Vercel | AWS / GCP | Zero-config deployment, generous free tiers |
| Email loading | Background polling | WebSockets | Simpler, no persistent connection needed |
| Token storage | localStorage (JWT) + httpOnly cookie (refresh) | All in cookies | Balance between usability and security |

---

## 9. Async Interaction Patterns

### 9.1 Server-Sent Events (SSE) — AI Streaming

AI features stream responses token by token so users see output immediately rather than waiting for the full response.

```
User clicks "Quick Summary"
  → Frontend → POST /api/v1/ai/summarize
  → Backend → Opens SSE stream (Content-Type: text/event-stream)
  → Groq LLM → Streams tokens one by one
  → Backend → Writes: data: {"text": "This "}\n\n
                        data: {"text": "email "}\n\n
                        data: {"text": "is about..."}\n\n
                        data: [DONE]\n\n
  → Frontend → ReadableStream reader decodes chunks
  → React state updates word by word → UI animates in real time
```

Used for: **Summarize**, **Draft Reply**

---

### 9.2 Background Email Polling

Emails load in two phases — fast initial batch, then background fetch of the rest.

```
Phase 1 (immediate, ~1-2s):
  GET /api/v1/emails
    → First 50 IDs fetched → details fetched in parallel → returned

Phase 2 (background, non-blocking):
  Backend → fetches remaining IDs + details in chunks of 50
  Frontend → polls GET /api/v1/emails/more every 3s
    → New emails merged into inbox (deduped by ID)
    → Progress bar: "Loading X of Y..."
    → Polling stops when backend signals loading: false
```

---

### 9.3 AI Auto-Labeling (Background)

```
Phase 1 — First 10 emails (parallel, immediate):
  Promise.all([
    POST /api/v1/ai/label { subject, body },  ← email 1
    POST /api/v1/ai/label { subject, body },  ← email 2
    ...10 concurrent requests
  ])
  → Labels appear on emails within seconds of inbox load

Phase 2 — Remaining emails (sequential, background):
  for each remaining email:
    POST /api/v1/ai/label
    await 200ms  ← rate limit protection
  → Sidebar progress bar updates after each label
  → Progress bar disappears when all emails are labeled
```

---

### 9.4 Silent JWT Refresh

```
Frontend → API request → 401 Unauthorized
  → authFetch() catches 401
  → POST /api/v1/auth/refresh (httpOnly cookie sent automatically)
  → Backend → validates refresh token → issues new JWT
  → Frontend → updates localStorage → retries original request
  → User sees no interruption
```

If refresh token is also expired:
```
  → POST /api/v1/auth/refresh → 401
  → refreshAccessToken() returns null
  → Original request fails with error
  → User prompted to reconnect their email account
```

---

## 10. Failure Handling

| Failure | Behaviour |
|---------|-----------|
| Gmail API down | Error shown, other accounts still load |
| Groq API down | AI features show error, email reading unaffected |
| JWT expired | Silent refresh, user uninterrupted |
| Refresh token expired | User must reconnect their email account |
| PostgreSQL down | Server fails to start, clear error logged |
| Background labeling fails | Silently skipped, email shows without label |

---

## 10. Deliverables Summary

| Item | Status | Location |
|------|--------|----------|
| Live Vercel URL | ✅ | https://ai-email-client-frontend.vercel.app |
| Backend API | ✅ | https://ai-email-client-backend-production.up.railway.app |
| CLAUDE.md | ✅ | Both repos root |
| Architecture doc | ✅ | docs/architecture.md |
| HLD | ✅ | docs/hld.md |
| Workflow writeup | ✅ | docs/workflow.md |
| Agent definitions | ✅ | AGENTS.md |
| Specs | ✅ | specs/ |
| Frontend tests | ✅ | src/__tests__/ (9 tests) |
| Backend tests | ✅ | src/__tests__/ (10 tests) |
