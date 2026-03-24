# Event OS

**The event management platform that Cvent charges $20K/year for, except you can clone it and run it in 5 minutes.**

We run Dev Summit in Mongolia. Every year it's the same story: 47 spreadsheets, 200 Telegram messages, one person who "definitely sent that invoice" (they didn't), and a check-in line that makes people question their life choices.

Cvent wants $20K/year + $10K implementation. Bizzabo won't even show you pricing without a sales call. Sessionize handles CFPs but not payments. Eventbrite handles tickets but not schedules. So you end up with 6 tools duct-taped together and a spreadsheet that is technically load-bearing.

Event OS replaces all of that. One app. Speakers, schedule, sponsors, booths, volunteers, media partners, marketing, check-in. Multi-event support so next year you don't start from zero.

Built by a 3-person team for 3-person teams. If you're running a tech conference with spreadsheets and prayers, this is for you. If you're a founder who can vibe-code, fork it and make it yours in an afternoon.

## What's in the box

| Module | What it does | What you'd otherwise use |
|--------|-------------|------------------------|
| **Agenda Builder** | Multi-track schedule editor, conflict detection (speaker double-booked? room collision? 5-minute gap between talks?), draft/publish toggle | Google Sheets + hope |
| **Speaker Pipeline** | CFP form, review scores, accept/reject/waitlist, application status tracking | Google Forms + another spreadsheet |
| **Sponsor Pipeline** | Proposal to payment tracking | Email threads + memory |
| **Booth Management** | Inventory grid, reservations, equipment lists, sponsor linking | A floor plan PDF and sticky notes |
| **Volunteer Management** | Applications, shift assignments, t-shirt sizes | A WhatsApp group |
| **Media Partners** | TV/press/podcast pipeline with deliverables tracking | "I think Bayaraa said they'd cover it?" |
| **Marketing Planner** | Campaign calendar, speaker announcements, schedule/publish per platform | Posting manually and forgetting LinkedIn |
| **QR Check-in** | Scanner mode + dashboard mode, offline support, works when the venue WiFi inevitably dies | Paper lists and highlighters |
| **Public Agenda** | Attendee-facing schedule with day/track filters | A PDF that's outdated by the time you export it |
| **CFP Form** | Public speaker application with validation | Google Forms (again) |

## Architecture

The system is two halves: a web app for visual work (building schedules, managing pipelines) and a Telegram agent for quick decisions (approve this speaker? chase that invoice?). Both read/write the same database.

```mermaid
graph TB
    subgraph "Organizers"
        WEB["Web App<br/>(Next.js on Vercel)"]
        TG["Telegram Agent<br/>(OpenClaw on Railway)"]
    end

    subgraph "External Users"
        PUB["Public Agenda"]
        CFP["CFP Form"]
        SP["Speaker Portal"]
        SCAN["QR Check-in"]
    end

    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        QUEUE["Event Queue<br/>(DB table)"]
        STORE["File Storage<br/>(Supabase Storage)"]
    end

    subgraph "Integrations"
        QPAY["QPay<br/>(Mongolia)"]
        EMAIL["Email<br/>(Resend)"]
    end

    WEB -->|Drizzle ORM| DB
    WEB -->|writes events| QUEUE
    TG -->|polls queue| QUEUE
    TG -->|REST API calls| WEB
    PUB -->|reads published| DB
    CFP -->|POST /api/speakers| WEB
    SP -->|magic link auth| WEB
    SCAN -->|POST /api/check-in| WEB
    WEB -->|payment adapter| QPAY
    TG -->|notifications| EMAIL
```

### Data Model

```mermaid
erDiagram
    Organization ||--o{ EventSeries : has
    EventSeries ||--o{ EventEdition : has
    EventEdition ||--o{ Session : contains
    EventEdition ||--o{ Track : has
    EventEdition ||--o{ SpeakerApplication : receives
    EventEdition ||--o{ SponsorApplication : receives
    EventEdition ||--o{ VolunteerApplication : receives
    EventEdition ||--o{ MediaPartner : has
    EventEdition ||--o{ Booth : has
    EventEdition ||--o{ Campaign : plans
    EventEdition ||--o{ Attendee : registers
    Session }o--|| Track : "belongs to"
    Session }o--|| SpeakerApplication : "presented by"
    Booth }o--|| SponsorApplication : "reserved by"
    Campaign }o--|| SpeakerApplication : "announces"

    Organization {
        uuid id PK
        string name
        string slug
    }
    EventEdition {
        uuid id PK
        string name
        date start_date
        date end_date
        enum status "draft|published|archived"
        enum agenda_status "draft|published"
    }
    Session {
        uuid id PK
        string title
        enum type "talk|workshop|keynote|break|panel"
        timestamp start_time
        timestamp end_time
        int day
        int version "optimistic locking"
    }
    SpeakerApplication {
        uuid id PK
        string name
        string email
        string talk_title
        enum status "pending|accepted|rejected|waitlisted"
        int review_score
    }
    Attendee {
        uuid id PK
        string name
        string email
        string qr_hash
        boolean checked_in
        string checked_in_by "station ID"
    }
```

### Request Flow

```mermaid
sequenceDiagram
    participant S as Speaker
    participant W as Web App
    participant DB as PostgreSQL
    participant Q as Event Queue
    participant A as Telegram Agent
    participant O as Organizer

    S->>W: Submit CFP application
    W->>DB: INSERT speaker_application
    W->>Q: INSERT event (speaker_submitted)
    W->>S: "Application received!"

    A->>Q: Poll for new events
    Q->>A: speaker_submitted event
    A->>W: GET /api/speakers/{id}
    W->>A: Speaker details
    A->>O: "New application: Sarah K. — Open Source in Central Asia" [Accept] [Reject]

    O->>A: Taps [Accept]
    A->>W: PATCH /api/speakers/{id} {status: accepted}
    W->>DB: UPDATE speaker SET status=accepted, version=version+1
    A->>O: "Done. Sarah gets acceptance email + onboarding checklist."
```

### Check-in Flow (with offline support)

```mermaid
stateDiagram-v2
    [*] --> Online: App loads
    Online --> Scanning: Point camera at QR
    Scanning --> Success: Valid QR, not checked in
    Scanning --> AlreadyIn: Valid QR, already checked in
    Scanning --> NotFound: Invalid QR
    Success --> Scanning: Auto-reset 3s
    AlreadyIn --> Scanning: Auto-reset 3s
    NotFound --> SearchFallback: Search by name
    SearchFallback --> Scanning: Found and checked in

    Online --> Offline: Network lost
    Offline --> OfflineScanning: Continue scanning
    OfflineScanning --> Queued: Validate against local cache
    Queued --> OfflineScanning: Queue check-in event
    Offline --> Syncing: Network restored
    Syncing --> Online: First-check-in-wins merge
```

## Tech Stack

Not trying to be clever here. Boring tech that works.

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server components, API routes, one deploy target |
| Language | TypeScript | Catch bugs before your users do |
| Styling | Tailwind + shadcn/ui | Fast, accessible components out of the box |
| Database | PostgreSQL via Supabase | Free tier is generous, comes with storage |
| ORM | Drizzle | Type-safe, no magic, SQL when you need it |
| Auth | NextAuth.js | Credentials + service token for the agent |
| Agent | OpenClaw + Telegram Bot API | Organizers already live in Telegram |
| Icons | Lucide React | Consistent, tree-shakeable |

## Getting Started

```bash
git clone https://github.com/amarbayar/event-os.git
cd event-os
npm install
cp .env.example .env.local
# Edit .env.local — add your Supabase URL and a random AUTH_SECRET
npm run dev
```

That's it. Open `localhost:3000`. You have an event management platform.

### Environment Variables

| Variable | What it is |
|----------|-----------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `AUTH_SECRET` | Any random string. Run `openssl rand -base64 32` to generate one |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev, your domain for prod |
| `SERVICE_TOKEN` | Random token for Telegram agent API auth |

### Deploy

```bash
# Vercel (web app)
vercel --prod

# The agent runs on Railway or Fly.io as a long-running Node service
```

## Project Structure

```
src/
  app/
    (dashboard)/        # Authenticated organizer pages
      agenda/           # Schedule builder
      speakers/         # CFP pipeline
      sponsors/         # Sponsor pipeline
      booths/           # Booth inventory
      volunteers/       # Volunteer management
      media/            # Media partnerships
      marketing/        # Campaign planner
      attendees/        # Registration list
      check-in/         # QR scanner + dashboard
      settings/         # Event configuration
    (public)/           # No-auth pages
      agenda/[slug]/    # Public schedule
      apply/[slug]/     # CFP submission form
    api/                # REST API routes
  db/
    schema.ts           # Drizzle schema (16 tables)
    index.ts            # Database connection
  lib/
    auth.ts             # NextAuth configuration
    conflicts.ts        # Schedule conflict detection engine
    api-utils.ts        # Auth context, versioning, pagination
    service-token.ts    # Agent API authentication
  components/
    sidebar.tsx         # App shell with responsive nav
    ui/                 # shadcn/ui components
```

## Key Design Decisions

**Why a PostgreSQL event queue instead of webhooks?** If the agent is down when a speaker applies, a webhook is lost forever. A queue table means events wait until the agent picks them up. Boring? Yes. Loses data? No.

**Why version counters instead of timestamps for optimistic locking?** Two writes in the same millisecond both succeed with timestamp-based locking. A monotonic integer doesn't have that problem.

**Why first-check-in-wins for offline sync?** Check-in is monotonic — once someone is checked in, they're checked in. Last-write-wins could accidentally un-check-in someone. First-check-in-wins can't.

**Why not just build a Telegram bot without the web app?** You can't build a drag-and-drop schedule editor in a chat message. Some workflows need visual UI. Some need quick chat decisions. The hybrid lets organizers pick.

## For Vibe Coders

This entire codebase was built in one session with AI. Every page follows the same pattern:

1. Stat cards at the top (2-col mobile, 4-col desktop)
2. Filter buttons below
3. Entity cards with status badges and actions
4. Empty states with helpful CTAs

Want to add a new entity type (e.g., "Hackathon Teams")? Copy `src/app/(dashboard)/volunteers/page.tsx`, change the fields, add a table to `src/db/schema.ts`, done. The pattern is the product.

## Security

This is a **public repository**. A pre-commit hook scans every commit for API keys, tokens, and credentials. See `.githooks/pre-commit`.

Never commit `.env.local`. The `.env.example` file has safe placeholders only.

## Contributing

PRs welcome. Read `CLAUDE.md` for project conventions and the secret safety checklist.

## License

MIT — do whatever you want with it.
