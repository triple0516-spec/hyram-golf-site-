-- Execute manually in a provisioned Supabase/PostgreSQL project after verifying the project owner.
-- Auth identities are created by Supabase Auth, not by writing public client-side rows.
create table if not exists public.hyram_admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  owner_slot smallint not null default 1 unique check (owner_slot = 1),
  granted_at timestamptz not null default now()
);
alter table public.hyram_admin_members enable row level security;
revoke all on table public.hyram_admin_members from public, anon, authenticated;
-- No public/anonymous/admin-self-assignment INSERT/UPDATE/DELETE policy.
-- Membership is granted using server-side service-role credentials only.
create or replace function public.hyram_is_owner()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hyram_admin_members m
    where m.user_id = auth.uid() and m.role = 'owner'
  );
$$;
revoke all on function public.hyram_is_owner() from public;
revoke all on function public.hyram_is_owner() from anon;
grant execute on function public.hyram_is_owner() to authenticated;
-- Intentionally DO NOT expose booking_requests or customer PII here.
-- Add explicit RLS policies only after separately testing the admin dashboard and API.
