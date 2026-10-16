create table if not exists public.register_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists register_attempts_ip_time on public.register_attempts (ip_hash, created_at desc);

alter table public.register_attempts enable row level security;

notify pgrst, 'reload schema';
