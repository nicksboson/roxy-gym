-- ============================================================
-- Roxy GYM — Add gender column to members
-- ============================================================

alter table public.members
  add column if not exists gender text
    check (gender in ('Male', 'Female', 'Other'));
