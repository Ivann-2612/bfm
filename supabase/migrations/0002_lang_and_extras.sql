
alter table public.registrations
  add column if not exists lang text not null default 'sr';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'registrations_lang_check') then
    alter table public.registrations
      add constraint registrations_lang_check check (lang in ('sr', 'en'));
  end if;
end $$;

alter table public.registrations
  add column if not exists extras jsonb not null default '{}';

alter table public.registrations drop column if exists companions;
alter table public.registrations drop column if exists transfer;

notify pgrst, 'reload schema';
