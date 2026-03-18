# VoiceIQ

**Communication intelligence for SCP Health's BSA team.**

VoiceIQ analyzes meeting transcripts and gives each participant a personal communication mirror — scoring clarity, pacing, topic leadership, and share of voice, then generating AI-powered coaching tips with real before/after examples pulled directly from the conversation.

> *Inspired by and dedicated to Ben Sommers — whose belief that great communication is a learnable skill made this worth building.*

---

## What it does

Paste a meeting transcript. VoiceIQ identifies every speaker, measures how they communicated, and surfaces specific, actionable coaching — not generic advice, but observations tied to exact moments in that conversation.

**For each speaker:**
- **Share of Voice** — what percentage of the meeting they held
- **Clarity Score** — how clearly they expressed ideas
- **Topic Leadership** — how often they introduced or drove topics
- **Conciseness** — signal-to-noise ratio in their language
- **Pacing** — slow, good, or fast relative to the room
- **Coaching Tips** — specific before/after examples from the actual transcript, each tagged by priority and effort so you know where to start

**For the meeting:**
- Topic coverage map — who owned what, and how thoroughly
- Overall meeting effectiveness score
- Summary of the conversation arc

**Director view (Team Pulse):**
- Aggregate scores across all BSA team members over time
- Track communication growth as a team metric

---

## How it works

```
Transcript pasted in browser
        ↓
Speaker detection + identity matching
        ↓
POST /api/analyze (Vercel serverless function)
        ↓
Row inserted in Supabase → status: processing
        ↓
Claude API (claude-sonnet-4) analyzes transcript
        ↓
Scores written to Supabase → status: complete
Full transcript cleared (HIPAA-adjacent caution)
        ↓
Browser navigates to /results/:id
```

The frontend never stores or transmits the transcript beyond the single analysis call. Only a 200-character preview is persisted.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS (SCP Health brand tokens) |
| Auth + DB | Supabase (Postgres + Row Level Security) |
| AI | Anthropic Claude (claude-sonnet-4) |
| Hosting | Vercel (Fluid Compute for long-running functions) |
| Functions | `@vercel/node` serverless at `api/analyze.ts` |

---

## Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [Vercel](https://vercel.com) account

### 1. Clone and install

```bash
git clone https://github.com/napville2000/voiceiq.git
cd voiceiq
npm install
```

### 2. Create Supabase project

1. [supabase.com](https://supabase.com) → New Project
2. SQL Editor → run all four migrations in order:
   ```
   supabase-migration.sql
   supabase-migration-v2.sql
   supabase-migration-v3.sql
   supabase-migration-v4.sql
   ```
3. Copy your **Project URL** and **anon key** from Settings → API

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side only — never expose these
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 4. Run locally

```bash
npx vercel dev   # runs frontend + API functions together
```

App is at `http://localhost:3000`

### 5. Deploy to Vercel

```bash
git push  # Vercel auto-deploys on push if connected
```

In Vercel dashboard → Project → Settings → Environment Variables, add all 5 variables from above.

Then → Settings → Functions → enable **Fluid Compute**. This is required — Claude analysis takes 20–40 seconds and Fluid Compute ensures the function window is long enough.

---

## Adding users

VoiceIQ is invite-only. There is no self-registration.

**To invite a new user:**

1. Supabase dashboard → **Authentication → Users → Invite user**
2. Enter their email — Supabase sends them a magic link
3. They click the link, land on `/setup`, enter their full name
4. Their profile is created automatically with `role: analyst`

**To grant Director access** (Team Pulse page):

```sql
UPDATE public.profiles SET role = 'director' WHERE email = 'user@scphealth.com';
```

---

## Project structure

```
voiceiq/
├── api/
│   └── analyze.ts          Vercel function — Claude API, Supabase writes
├── src/
│   ├── components/
│   │   ├── TipCard.tsx         Coaching tip with before/after + Explain drill-down
│   │   ├── SpeakerIdentityModal.tsx  Lets user identify themselves in transcript
│   │   ├── MetricTooltip.tsx   Score explanations on hover
│   │   ├── MethodologyDrawer.tsx     How scoring works
│   │   ├── NavBar.tsx
│   │   ├── ProtectedRoute.tsx  Redirects to /setup if name not set
│   │   └── DirectorRoute.tsx   Blocks /team for non-directors
│   ├── hooks/
│   │   └── useAuth.tsx         Supabase auth context
│   ├── lib/
│   │   ├── supabase.ts         Supabase client
│   │   └── speakerMatch.ts     Fuzzy-matches user's name to transcript speakers
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SetupPage.tsx       First-login name capture
│   │   ├── DashboardPage.tsx   Home + in-progress job banner
│   │   ├── AnalyzePage.tsx     Transcript submission form
│   │   ├── ResultsPage.tsx     Full analysis view
│   │   ├── HistoryPage.tsx     Past analyses
│   │   └── TeamPulsePage.tsx   Director-only aggregate view
│   └── types/index.ts          All TypeScript interfaces
├── supabase-migration*.sql     Run in order to set up the DB schema
├── vercel.json                 SPA routing + Fluid Compute config
└── tsconfig.api.json           Separate TS config for the api/ folder
```

---

## Confidentiality

Meeting transcripts are processed in-memory and never stored permanently. Only a 200-character preview is retained in the database. Full transcripts are cleared from the database immediately after analysis completes. Do not paste transcripts containing PHI, patient names, or personal identification.

---

## Internal use only

VoiceIQ is an internal SCP Health tool built for the BSA team. It is not intended for public distribution.

© 2025 SCP Health
