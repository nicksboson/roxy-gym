-- Migration: 20260928000000_direct_access_no_auth.sql (Superseded)
-- Replaced by 20260928000002_owner_management_auth_and_rls.sql
-- Direct unauthenticated access is disabled: only the Gym Owner is authenticated.

-- Ensure any temporary anon policies are safely removed
drop policy if exists "Anon full access to plans" on public.plans;
drop policy if exists "Anon direct access to plans" on public.plans;
drop policy if exists "Anon full access to members" on public.members;
drop policy if exists "Anon direct access to members" on public.members;
drop policy if exists "Anon full access to payments" on public.payments;
drop policy if exists "Anon direct access to payments" on public.payments;
drop policy if exists "Anon full access to profiles" on public.profiles;
drop policy if exists "Anon direct access to profiles" on public.profiles;

revoke insert, update, delete on public.members from anon;
revoke insert, update, delete on public.payments from anon;
revoke insert, update, delete on public.profiles from anon;
