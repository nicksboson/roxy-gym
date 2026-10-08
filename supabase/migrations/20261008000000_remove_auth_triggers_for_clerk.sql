-- ============================================================
-- Roxy GYM — Remove Supabase Auth Triggers (Clerk Auth Migration)
-- Migration: 20261008000000_remove_auth_triggers_for_clerk.sql
-- ============================================================

-- Drop the trigger that fires when a user is created in auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop all policies that depend on is_admin() first
drop policy if exists "Users view own profile, admins view all" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins manage plans" on public.plans;
drop policy if exists "Admins see all, members see own" on public.members;
drop policy if exists "Admins insert members" on public.members;
drop policy if exists "Admins update members" on public.members;
drop policy if exists "Admins delete members" on public.members;
drop policy if exists "Admins and owners view payments" on public.payments;
drop policy if exists "Admins record payments" on public.payments;
drop policy if exists "Admins update payments" on public.payments;
drop policy if exists "Admins delete payments" on public.payments;

-- Now drop the is_admin function
drop function if exists public.is_admin();

-- Recreate simple policies that allow any authenticated user full access
-- (There is only one owner, so this is safe)
create policy "Authenticated full access to members"
  on public.members for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access to payments"
  on public.payments for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access to plans"
  on public.plans for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated full access to profiles"
  on public.profiles for all
  to authenticated
  using (true)
  with check (true);
