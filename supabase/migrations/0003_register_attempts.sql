-- Rate limit for /api/register: one row per attempt, keyed by a hashed IP (the IP itself is never stored).
-- Rows older than two days are deleted by the daily cron (/api/cron/expire).
create table if not exists public.register_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists register_attempts_ip_time on public.register_attempts (ip_hash, created_at desc);

-- Same as registrations: RLS on, no policies, only the server's secret key can read or write.
alter table public.register_attempts enable row level security;

notify pgrst, 'reload schema';
