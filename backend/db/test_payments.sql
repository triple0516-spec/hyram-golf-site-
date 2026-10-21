-- Run in the connected project's SQL Editor before deploying toss-test.
create table if not exists public.hyram_test_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  amount integer not null check (amount = 1000),
  status text not null default 'created' check (status in ('created','processing','done')),
  payment_key text unique,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.hyram_test_orders enable row level security;
revoke all on public.hyram_test_orders from anon, authenticated;
grant select, insert, update on public.hyram_test_orders to service_role;
-- No browser policies: only the server may read or mutate test orders.
