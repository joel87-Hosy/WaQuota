alter table public.quotes
add column if not exists reminder_sent_at timestamptz,
add column if not exists reminder_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotes_reminder_count_non_negative'
  ) then
    alter table public.quotes
    add constraint quotes_reminder_count_non_negative check (reminder_count >= 0);
  end if;
end;
$$;

create index if not exists quotes_user_id_reminder_sent_at_idx
  on public.quotes (user_id, reminder_sent_at desc);
