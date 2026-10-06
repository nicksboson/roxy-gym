-- ============================================================
-- Roxy GYM — Owner Authentication & Management Schema Migration
-- Migration: 20260928000002_owner_management_auth_and_rls.sql
-- ============================================================
-- App is strictly for Gym Owner / Administrator management.
-- Regular gym members do NOT have auth accounts.
-- Only the Gym Owner is authenticated and manages members,
-- plans, payments, and photos.
-- ============================================================

-- 1. Helper function for admin check (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 2. Trigger: Set role = 'admin' on user creation (since only owner has an account)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do update
    set role = 'admin',
        name = coalesce(excluded.name, profiles.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Revoke anonymous write access from sensitive tables
revoke insert, update, delete on public.members from anon;
revoke insert, update, delete on public.payments from anon;
revoke insert, update, delete on public.plans from anon;
revoke insert, update, delete on public.profiles from anon;

-- Drop loose anonymous policies if they exist
drop policy if exists "Anon full access to members" on public.members;
drop policy if exists "Anon direct access to members" on public.members;
drop policy if exists "Anon full access to payments" on public.payments;
drop policy if exists "Anon direct access to payments" on public.payments;
drop policy if exists "Anon full access to profiles" on public.profiles;
drop policy if exists "Anon direct access to profiles" on public.profiles;
drop policy if exists "Anon full access to plans" on public.plans;
drop policy if exists "Anon direct access to plans" on public.plans;

-- 4. Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.plans    enable row level security;
alter table public.members  enable row level security;
alter table public.payments enable row level security;

-- 5. Grant full access to authenticated role (Gym Owner)
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select on public.plans to anon;

-- 6. Members Policies
drop policy if exists "Admins see all, members see own" on public.members;
drop policy if exists "Admins insert members" on public.members;
drop policy if exists "Admins update members" on public.members;
drop policy if exists "Admins delete members" on public.members;
drop policy if exists "Owner full access to members" on public.members;

create policy "Owner full access to members"
  on public.members for all
  to authenticated
  using (true)
  with check (true);

-- 7. Payments Policies
drop policy if exists "Admins and owners view payments" on public.payments;
drop policy if exists "Admins record payments" on public.payments;
drop policy if exists "Admins update payments" on public.payments;
drop policy if exists "Admins delete payments" on public.payments;
drop policy if exists "Owner full access to payments" on public.payments;

create policy "Owner full access to payments"
  on public.payments for all
  to authenticated
  using (true)
  with check (true);

-- 8. Plans Policies
drop policy if exists "Anyone can read plans" on public.plans;
drop policy if exists "Admins manage plans" on public.plans;
drop policy if exists "Owner full access to plans" on public.plans;

create policy "Anyone can read plans"
  on public.plans for select
  to anon, authenticated
  using (true);

create policy "Owner full access to plans"
  on public.plans for all
  to authenticated
  using (true)
  with check (true);

-- 9. Profiles Policies
drop policy if exists "Users view own profile, admins view all" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Owner full access to profiles" on public.profiles;

create policy "Owner full access to profiles"
  on public.profiles for all
  to authenticated
  using (true)
  with check (true);

-- 10. Storage Buckets and Storage Policies
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read member photos" on storage.objects;
drop policy if exists "Public read photos" on storage.objects;
drop policy if exists "Owner upload member photos" on storage.objects;
drop policy if exists "Owner upload photos" on storage.objects;
drop policy if exists "Owner update member photos" on storage.objects;
drop policy if exists "Owner update photos" on storage.objects;
drop policy if exists "Owner delete member photos" on storage.objects;
drop policy if exists "Owner delete photos" on storage.objects;

create policy "Public read photos"
  on storage.objects for select
  to public
  using (bucket_id in ('member-photos', 'profile-photos'));

create policy "Owner upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('member-photos', 'profile-photos'));

create policy "Owner update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('member-photos', 'profile-photos'))
  with check (bucket_id in ('member-photos', 'profile-photos'));

create policy "Owner delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('member-photos', 'profile-photos'));
