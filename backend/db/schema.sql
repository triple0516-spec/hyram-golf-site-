-- HYRAM GOLF reservation backend schema (PostgreSQL/Supabase-ready)
create extension if not exists pgcrypto;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service text not null check (service in ('피팅','레슨','중고클럽','부킹','클럽 구매')),
  customer_name text not null,
  preferred_date date,
  preferred_time time,
  contact_method text not null check (contact_method in ('카카오톡','전화','문자')),
  phone text not null,
  memo text,
  privacy_consent boolean not null default false,
  status text not null default 'received' check (status in ('received','contacted','confirmed','cancelled'))
);

alter table public.booking_requests enable row level security;

-- Do NOT add anonymous SELECT/UPDATE/DELETE policies.
-- Inserts should go through a server-side endpoint that validates input.
create index if not exists booking_requests_created_at_idx on public.booking_requests(created_at desc);
create index if not exists booking_requests_status_idx on public.booking_requests(status);
