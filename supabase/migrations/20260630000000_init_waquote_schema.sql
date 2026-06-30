create extension if not exists pgcrypto;

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  prospect_name text not null,
  prospect_phone text not null,
  amount numeric(12, 2) not null,

  pdf_path text not null,
  public_token uuid not null default gen_random_uuid(),

  opened boolean not null default false,
  opened_at timestamptz,
  open_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quotes_public_token_unique unique (public_token),
  constraint quotes_amount_non_negative check (amount >= 0),
  constraint quotes_open_count_non_negative check (open_count >= 0),
  constraint quotes_phone_not_blank check (length(trim(prospect_phone)) > 0),
  constraint quotes_prospect_name_not_blank check (length(trim(prospect_name)) > 0),
  constraint quotes_pdf_path_not_blank check (length(trim(pdf_path)) > 0)
);

create index quotes_user_id_created_at_idx
  on public.quotes (user_id, created_at desc);

create index quotes_user_id_opened_created_at_idx
  on public.quotes (user_id, opened, created_at desc);

create index quotes_public_token_idx
  on public.quotes (public_token);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_quotes_updated_at
before update on public.quotes
for each row
execute function public.set_updated_at();

create or replace function public.track_quote_open(p_token uuid)
returns table (
  quote_id uuid,
  pdf_path text,
  prospect_name text,
  amount numeric,
  opened_at timestamptz,
  open_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.quotes q
  set
    opened = true,
    opened_at = coalesce(q.opened_at, now()),
    open_count = q.open_count + 1,
    updated_at = now()
  where q.public_token = p_token
  returning
    q.id,
    q.pdf_path,
    q.prospect_name,
    q.amount,
    q.opened_at,
    q.open_count;
end;
$$;

alter table public.quotes enable row level security;

create policy "Users can read their own quotes"
on public.quotes
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own quotes"
on public.quotes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own quotes"
on public.quotes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own quotes"
on public.quotes
for delete
to authenticated
using (auth.uid() = user_id);

grant execute on function public.track_quote_open(uuid) to anon;
grant execute on function public.track_quote_open(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotes-pdf',
  'quotes-pdf',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their quote PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read their quote PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their quote PDFs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their quote PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);
