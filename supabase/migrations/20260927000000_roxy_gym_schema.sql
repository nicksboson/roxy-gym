-- ============================================================
-- Roxy GYM — Supabase PostgreSQL Schema
-- Run this once in the Supabase SQL Editor
-- ============================================================

-- ── 1. Profiles (linked to Supabase Auth) ───────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  address     text,
  role        text not null default 'member' check (role in ('admin', 'member')),
  photo_url   text,                          -- URL from Supabase Storage bucket: profile-photos
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 2. Plans (1 Month / 3 Months / 6 Months / 1 Year) ──────
create table if not exists public.plans (
  id            uuid primary key default gen_random_uuid(),
  plan_name     text not null unique,
  duration_days integer not null check (duration_days > 0),
  price         numeric(10,2) not null check (price >= 0),
  created_at    timestamptz not null default now()
);

-- ── 3. Members ───────────────────────────────────────────────
create table if not exists public.members (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  name            text not null,
  phone           text not null,
  email           text,
  address         text,
  photo_url       text,                          -- URL from Supabase Storage bucket: member-photos
  plan_id         uuid references public.plans(id) on delete set null,
  plan_name       text,
  start_date      date not null default current_date,
  expiry_date     date not null,
  amount          numeric(10,2) not null default 0 check (amount >= 0),
  payment_status  text not null default 'pending'
                    check (payment_status in ('paid', 'pending', 'cancelled')),
  payment_method  text default 'UPI'
                    check (payment_method in ('UPI', 'Cash', 'Card', 'Pending')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 4. Payments (full payment history per member) ───────────
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  plan_name     text,
  amount        numeric(10,2) not null check (amount >= 0),
  method        text not null default 'UPI'
                  check (method in ('UPI', 'Cash', 'Card', 'Pending')),
  status        text not null default 'paid'
                  check (status in ('paid', 'pending')),
  payment_date  date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ── Indexes for performance ──────────────────────────────────
create index if not exists idx_members_user_id    on public.members(user_id);
create index if not exists idx_members_plan_id    on public.members(plan_id);
create index if not exists idx_members_expiry     on public.members(expiry_date);
create index if not exists idx_payments_member_id on public.payments(member_id);
create index if not exists idx_payments_date      on public.payments(payment_date);

-- ── Admin check helper ───────────────────────────────────────
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

-- ── Enable Row Level Security ────────────────────────────────
alter table public.profiles enable row level security;
alter table public.plans    enable row level security;
alter table public.members  enable row level security;
alter table public.payments enable row level security;

-- ── RLS: Profiles ────────────────────────────────────────────
create policy "Users view own profile, admins view all"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id or public.is_admin())
  with check ((select auth.uid()) = id or public.is_admin());

-- ── RLS: Plans (public read, admin write) ────────────────────
create policy "Anyone can read plans"
  on public.plans for select to anon, authenticated
  using (true);

create policy "Admins manage plans"
  on public.plans for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── RLS: Members ─────────────────────────────────────────────
create policy "Admins see all, members see own"
  on public.members for select to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "Admins insert members"
  on public.members for insert to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "Admins update members"
  on public.members for update to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "Admins delete members"
  on public.members for delete to authenticated
  using (public.is_admin());

-- ── RLS: Payments ────────────────────────────────────────────
create policy "Admins and owners view payments"
  on public.payments for select to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "Admins record payments"
  on public.payments for insert to authenticated
  with check (public.is_admin());

create policy "Admins update payments"
  on public.payments for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete payments"
  on public.payments for delete to authenticated
  using (public.is_admin());

-- ── API Grants ───────────────────────────────────────────────
grant select, insert, update, delete on public.profiles  to authenticated;
grant select, insert, update, delete on public.plans     to authenticated;
grant select, insert, update, delete on public.members   to authenticated;
grant select, insert, update, delete on public.payments  to authenticated;
grant select on public.plans to anon;

-- ── Seed: Default plans ──────────────────────────────────────
insert into public.plans (plan_name, duration_days, price) values
  ('1 Month',  30,  1500.00),
  ('3 Months', 90,  4000.00),
  ('6 Months', 180, 7500.00),
  ('1 Year',   365, 14000.00)
on conflict (plan_name) do nothing;

-- ── Trigger: Auto-create profile on signup ───────────────────
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
