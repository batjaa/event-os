# Event OS

## CRITICAL: Public Repository — Secret Safety

This is a PUBLIC open-source repository. NEVER commit:
- API keys, tokens, passwords, or credentials
- `.env`, `.env.local`, `.env.production`, or any env files
- Database connection strings
- Service tokens or auth secrets
- Private keys (*.pem, *.key)
- Any file containing real user data

Before EVERY commit:
1. Check `.gitignore` covers all secret files
2. Never use `git add -A` blindly — review staged files
3. Scan staged content for: API_KEY, SECRET, TOKEN, PASSWORD, PRIVATE_KEY, DATABASE_URL, Bearer, sk-, pk_
4. Use `.env.example` with placeholder values only — never real credentials
5. If you accidentally stage a secret, unstage it immediately. If committed, the repo history must be cleaned.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + PostgreSQL (Supabase)
- Auth: NextAuth (credentials) + service token for agent API
- Icons: lucide-react

## Project Structure
- `src/app/(dashboard)/` — authenticated organizer pages
- `src/app/(public)/` — public pages (agenda, CFP form)
- `src/app/api/` — REST API routes
- `src/db/` — Drizzle schema and database connection
- `src/lib/` — shared utilities (auth, conflicts, api-utils)
- `src/components/` — shared UI components

## Key Patterns
- All database tables scoped by `organization_id` (multi-tenant)
- Optimistic locking via `version` integer column (not timestamps)
- Check-in uses first-check-in-wins merge semantics
- OpenClaw communicates via PostgreSQL event queue, not webhooks
- API routes handle both session auth (web) and service token auth (agent)
