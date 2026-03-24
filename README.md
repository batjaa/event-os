# Event OS

Your event command center. Manage speakers, schedule sessions, track sponsors, run check-in, and coordinate volunteers — all from one workspace.

Built for small event teams (3-5 people) who run recurring developer conferences and don't have access to enterprise tools like Cvent or Bizzabo.

## Features

- **Agenda Builder** — Multi-track schedule editor with conflict detection (speaker double-booking, room conflicts, missing buffers)
- **Speaker Pipeline** — CFP intake, review scores, accept/reject/waitlist with one click
- **Sponsor Management** — Pipeline tracking from proposal to payment
- **Booth Management** — Booth inventory, reservations, equipment tracking
- **Volunteer Management** — Application pipeline, shift assignments
- **Media Partnerships** — TV, press, podcast partner pipeline with deliverables
- **Marketing Planner** — Social media campaign calendar with schedule/publish flow
- **QR Check-in** — Scanner mode + dashboard mode with offline support and first-check-in-wins sync
- **Public Agenda** — Attendee-facing schedule page with day/track filters
- **CFP Form** — Public speaker application form

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Auth:** NextAuth.js (credentials + service token)
- **Icons:** Lucide React

## Getting Started

```bash
# Clone the repo
git clone https://github.com/amarbayar/event-os.git
cd event-os

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values. **Never commit `.env.local`.**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `AUTH_SECRET` | Random string for NextAuth session encryption |
| `NEXTAUTH_URL` | Your app's URL (http://localhost:3000 for dev) |
| `SERVICE_TOKEN` | Token for agent API authentication |

## Architecture

```
Organizer (Web App)              Agent (Telegram via OpenClaw)
       |                                    |
       v                                    v
  Next.js App                         OpenClaw Skills
  (dashboard, agenda,                 (CFP review, comms,
   check-in, portals)                  reminders, alerts)
       |                                    |
       v                                    v
  ┌─────────────────────────────────────────────┐
  │           Supabase PostgreSQL                │
  │    (shared data + event queue)               │
  └─────────────────────────────────────────────┘
```

## Contributing

Contributions welcome! Please read the existing code patterns before submitting PRs.

**Important:** This is a public repository. Never commit API keys, credentials, or secrets. See `CLAUDE.md` for the full security checklist.

## License

MIT
