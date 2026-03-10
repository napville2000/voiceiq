-- ════════════════════════════════════════════════════════════════
-- VoiceIQ — Supabase Schema Migration v2
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run on top of v1 (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════════

-- Add self_speaker_name column to existing analyses table
-- This stores the raw speaker name Claude detected for the logged-in user.
-- NULL means the user was an observer (not in the transcript).
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS self_speaker_name text DEFAULT NULL;

-- ════════════════════════════════════════════════════════════════
-- That's it. All existing rows will have self_speaker_name = NULL
-- (treated as observer records in the history UI).
-- ════════════════════════════════════════════════════════════════
