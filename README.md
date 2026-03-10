# VoiceIQ — BSA Communication Intelligence
**SCP Health Internal Tool | Scaffold v1**

## Scaffold Status
- [x] React + TypeScript + Vite (clean build ✓)
- [x] SCP Health 2025 brand colors + Source Sans Pro
- [x] Supabase auth (email/password, protected routes, RLS)
- [x] Vercel serverless function — Claude API server-side (/api/analyze)
- [x] Health check endpoint (/api/health)
- [x] SQL migration with Row Level Security
- [x] Mock data mode (works without API key for UI testing)
- [x] Mobile-responsive layout
- [ ] YOUR STEP: Create Supabase project
- [ ] YOUR STEP: Push to GitHub + Deploy to Vercel
- [ ] YOUR STEP: Run supabase-migration.sql

## Deploy in 4 Steps

### Step 1 — Create Supabase Project
1. supabase.com → New Project → name it voiceiq
2. Settings → API → copy Project URL and anon public key
3. SQL Editor → New Query → paste supabase-migration.sql → Run

### Step 2 — Push to GitHub
  git init && git add . && git commit -m "VoiceIQ scaffold v1"
  # Create repo on github.com then:
  git remote add origin https://github.com/YOUR_USERNAME/voiceiq.git
  git push -u origin main

### Step 3 — Deploy to Vercel
1. vercel.com → New Project → Import GitHub repo
2. Add 3 Environment Variables:
   - VITE_SUPABASE_URL = your Supabase project URL
   - VITE_SUPABASE_ANON_KEY = your Supabase anon key
   - ANTHROPIC_API_KEY = your Anthropic API key (server-side only)
3. Deploy

### Step 4 — Create First User
1. Supabase Dashboard → Authentication → Users → Invite User
2. Enter your SCP email, check email, set password
3. To grant Director role:
   UPDATE public.profiles SET role = 'director' WHERE email = 'your@scphealth.com';

## Scaffold Verification Tests
| Test | Expected |
|------|----------|
| /login | SCP-branded login page |
| Sign in | Dashboard with your name |
| /analyze → paste text → Analyze | Mock JSON response |
| /history | DB connection status banner |
| /api/health | JSON status of supabase + claude |

## Local Dev
  cp .env.example .env.local   # fill in Supabase keys
  npm install && npm run dev   # http://localhost:5173
  npx vercel dev               # includes API functions

## Structure
  api/analyze.ts        Claude API — server-side, key never exposed
  api/health.ts         Health check
  src/hooks/useAuth.tsx Auth context + Supabase session
  src/pages/            Login, Dashboard, Analyze, History
  src/types/index.ts    All TypeScript interfaces
  supabase-migration.sql  Run once in Supabase SQL Editor
  vercel.json           Routing config
  .env.example          Copy to .env.local
