-- Initial Gym Plans Seed
insert into public.plans (plan_name, duration_days, price)
values
  ('1 Month', 30, 1500.00),
  ('3 Months', 90, 4000.00),
  ('6 Months', 180, 7500.00),
  ('1 Year', 365, 14000.00)
on conflict (plan_name) do nothing;

-- Sample Todos item so quickstart test passes
insert into public.todos (name, is_complete)
values
  ('Welcome to Roxy GYM on Supabase', true),
  ('Review active gym subscriptions', false)
on conflict do nothing;
