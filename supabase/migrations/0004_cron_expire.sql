create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'expire-registrations',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://pnpylpzcgoulsivplhip.supabase.co/functions/v1/expire',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
