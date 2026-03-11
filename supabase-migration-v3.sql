-- ════════════════════════════════════════════════════════════════
-- VoiceIQ — Supabase Schema Migration v3
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Adds status + error_message columns for background function support
-- Safe to run on top of v1+v2
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'complete',
  ADD COLUMN IF NOT EXISTS error_message text DEFAULT NULL;

-- Existing rows are already complete, default handles them.
-- New rows from analyze-start will be inserted as 'processing'
-- and updated to 'complete' or 'failed' by the background function.

-- Index for polling queries
CREATE INDEX IF NOT EXISTS analyses_status_idx ON public.analyses(status);
