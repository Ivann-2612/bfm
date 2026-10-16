
create table if not exists public.registrations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  event_year    smallint    not null,
  lang          text        not null default 'sr' check (lang in ('sr', 'en')),  -- language for follow-up emails

  first_name    text not null check (char_length(first_name) between 1 and 80),
  last_name     text not null check (char_length(last_name) between 1 and 80),
  email         text not null check (email = lower(email) and char_length(email) <= 200),
  phone         text,
  country       text not null,

  package_id    text     not null,
  extras        jsonb    not null default '{}',  -- add-ons actually charged, e.g. {"table": 1}
  notes         text,

  price_tier    text  not null check (price_tier in ('early', 'regular')),
  price_lines   jsonb not null,
  total_eur     integer not null check (total_eur >= 0),

  status        text not null default 'pending'
                check (status in ('pending', 'paid', 'expired', 'cancelled')),
  paid_at       timestamptz,
  expired_at    timestamptz,

  consent_text  text        not null,
  consent_at    timestamptz not null,

  constraint registrations_email_year_key unique (email, event_year)
);

create index if not exists registrations_pending_idx
  on public.registrations (created_at) where status = 'pending';

alter table public.registrations enable row level security;

create or replace function public.registrations_set_paid_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    new.paid_at := now();
  end if;
  return new;
end $$;

drop trigger if exists registrations_paid_at on public.registrations;
create trigger registrations_paid_at
  before update of status on public.registrations
  for each row execute function public.registrations_set_paid_at();
