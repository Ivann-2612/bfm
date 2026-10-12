-- Brings a registrations table created by an early version of 0001 up to date.
-- Safe to run more than once, and safe on a table that already has these columns.

-- Language of the registration (used for follow-up emails).
alter table public.registrations
  add column if not exists lang text not null default 'sr';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'registrations_lang_check') then
    alter table public.registrations
      add constraint registrations_lang_check check (lang in ('sr', 'en'));
  end if;
end $$;

-- Add-ons actually charged, e.g. {"table": 1}. Replaces the old companions/transfer columns.
alter table public.registrations
  add column if not exists extras jsonb not null default '{}';

alter table public.registrations drop column if exists companions;
alter table public.registrations drop column if exists transfer;

-- Make the API pick up the new columns immediately.
notify pgrst, 'reload schema';
