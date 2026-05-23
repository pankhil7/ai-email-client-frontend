# Claude Code Workflow — AI Email Client

## Overview

This project was built end-to-end using **Claude Code CLI** with a multi-agent, specs-driven workflow. The entire codebase — frontend, backend, services, tests, and deployment config — was produced through agentic sessions without manually writing code.

---

## How the Work Was Structured

### Phase 1 — Specs First
Before writing any code, spec files were created in `specs/`:
- `specs/inbox.md` — inbox layout, pagination, account switching, loading behaviour
- `specs/compose.md` — compose/reply/forward modal, recipient handling
- `specs/ai-features.md` — AI summary, draft reply, and priority scoring via Claude API

Each spec described the expected behaviour, not the implementation. Claude Code used these to guide decisions autonomously.

---

### Phase 2 — Multi-Agent Breakdown

Work was split across specialised agents running in parallel:

| Agent | Responsibility | Files Owned |
|-------|---------------|-------------|
| **UI Agent** | React components, Tailwind layout, mobile PWA | `src/components/**`, `src/app/**` |
| **API Agent** | Express routes, Gmail/Office365/IMAP services | `src/routes/**`, `src/services/**` |
| **AI Agent** | Claude API integration, SSE streaming | `src/services/ai.service.ts`, `AIPanel.tsx` |
| **Store Agent** | Zustand state, background polling, pagination | `src/store/emailStore.ts` |
| **Test Agent** | Vitest unit tests, store logic validation | `src/__tests__/**` |

Agents were invoked using the Claude Code `Agent` tool with `subagent_type` targeting specialised roles. Independent modules (UI vs API vs tests) ran in parallel; dependent changes (e.g. store changes before component updates) ran sequentially.

---

### Phase 3 — Iterative Feature Development

Features were built incrementally, each validated before moving on:

1. **Unified inbox** — Gmail API + IMAP fetch, unified display
2. **Background loading** — first 50 emails immediately, rest in background chunks with progress indicator
3. **Pagination** — 50 emails per page with Prev/Next controls
4. **Compose/Reply/Forward** — full modal with thread context
5. **AI features** — summarise, draft reply, prioritise (all streamed via SSE)
6. **Office 365** — Microsoft Graph API OAuth flow and mail operations
7. **Persistent accounts** — SQLite → PostgreSQL migration for Railway deployment
8. **Labels** — client-side label system with predefined categories and sidebar filtering
9. **PWA** — manifest, icons, mobile-first layout

---

### Phase 4 — Deployment

- **Backend** → Railway (Node.js + PostgreSQL)
- **Frontend** → Vercel (Next.js)
- Pre-built `dist/` committed to avoid Railway OOM on free tier
- Environment variables managed per-service (Railway Variables, Vercel Environment Variables)

---

## Hooks & Plugins Used

| Tool | Purpose |
|------|---------|
| **Claude Code Hooks** | Pre-commit validation, file change triggers |
| **CLAUDE.md** | Per-repo agent instructions and conventions |
| **AGENTS.md** | Agent role definitions for multi-agent coordination |
| **Specs (`specs/`)** | Behaviour-first feature definitions |

---

## Key Claude Code Patterns

**Parallel agents for independent modules:**
```
Agent(UI) + Agent(API) + Agent(Tests) → run simultaneously
```

**Sequential agents for dependent changes:**
```
Agent(Store: add label state) → Agent(UI: read label state from store)
```

**Explore before Edit:**
Every agent session started with Read/Grep/Glob to understand existing code before making changes — no blind edits.

**Specs-driven:**
Features were described in `specs/` before implementation. Agents referenced specs to stay aligned with requirements without needing constant re-prompting.

---

## Outcome

A fully deployed, production-ready AI email client in a single Claude Code session:
- **Frontend**: https://ai-email-client-frontend.vercel.app
- **Backend**: https://ai-email-client-backend-production.up.railway.app
- **Test suite**: `npm test` (Vitest, 10+ assertions)
- **Zero manual code** — every line produced by Claude Code agents
