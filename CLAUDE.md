# CLAUDE.md — AI Email Client Frontend

## Project
Next.js 14 (App Router) PWA — AI-first universal email client supporting Gmail, Office 365, and IMAP.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand (`src/store/emailStore.ts`)
- **Icons**: lucide-react
- **PWA**: manifest.json in `/public`
- **Backend**: `http://localhost:4000` (see `src/lib/api.ts`)

## Structure
```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── Sidebar/      # Navigation + account list
│   ├── EmailList/    # Unified inbox list
│   ├── EmailDetail/  # Email reading view
│   ├── Compose/      # Compose/reply/forward modal
│   ├── AI/           # AI summary, draft, priority panel
│   └── AccountModal/ # Add email account modal
├── store/            # Zustand state (emailStore.ts)
├── lib/              # API client (api.ts)
└── types/            # TypeScript types (email.ts)
```

## Agents
| Agent | Role |
|-------|------|
| UI Agent | Components, Tailwind styling, responsive layout |
| AI Agent | AIPanel streaming UI, Claude API integration |
| Test Agent | Vitest component tests |

## Dev Commands
```bash
npm run dev    # http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint
```

## Conventions
- All components are `'use client'` unless they're pure layout
- Tailwind only — no custom CSS except globals.css
- All API calls go through `src/lib/api.ts`
- All state in `src/store/emailStore.ts`

## Environment
Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_API_URL` — backend URL (default: http://localhost:4000)
