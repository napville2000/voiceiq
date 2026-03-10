-- ══════════════════════════════════════════════════════════════
-- VoiceIQ — Supabase Schema Migration v1
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  full_name    text not null,
  role         text not null default 'analyst' check (role in ('analyst', 'director')),
  created_at   timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'analyst'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Analyses table
create table if not exists public.analyses (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  meeting_name     text not null,
  meeting_date     date not null,
  transcript_preview text,           -- first 200 chars only, not full transcript
  scores           jsonb not null,   -- full AnalysisResult JSON
  created_at       timestamptz default now()
);

-- 3. Row Level Security — users only see their own data
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Directors can view all profiles (for Team Pulse)
create policy "Directors can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );

-- Analyses: users can CRUD their own
create policy "Users can view own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);

-- Directors can view all analyses (aggregate only — no transcripts stored)
create policy "Directors can view all analyses"
  on public.analyses for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );

-- 4. Indexes for performance
create index if not exists analyses_user_id_idx on public.analyses(user_id);
create index if not exists analyses_created_at_idx on public.analyses(created_at desc);

-- ══════════════════════════════════════════════════════════════
-- To create your first director account after running this:
-- 1. Sign up via the VoiceIQ login page
-- 2. Run: update public.profiles set role = 'director' where email = 'your@email.com';
-- ══════════════════════════════════════════════════════════════
