create extension if not exists pgcrypto;

create table if not exists public.quotes (
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
  reminder_sent_at timestamptz,
  reminder_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quotes_public_token_unique unique (public_token),
  constraint quotes_amount_non_negative check (amount >= 0),
  constraint quotes_open_count_non_negative check (open_count >= 0),
  constraint quotes_reminder_count_non_negative check (reminder_count >= 0),
  constraint quotes_phone_not_blank check (length(trim(prospect_phone)) > 0),
  constraint quotes_prospect_name_not_blank check (length(trim(prospect_name)) > 0),
  constraint quotes_pdf_path_not_blank check (length(trim(pdf_path)) > 0)
);

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

create index if not exists quotes_user_id_created_at_idx
  on public.quotes (user_id, created_at desc);

create index if not exists quotes_user_id_opened_created_at_idx
  on public.quotes (user_id, opened, created_at desc);

create index if not exists quotes_public_token_idx
  on public.quotes (public_token);

create index if not exists quotes_user_id_reminder_sent_at_idx
  on public.quotes (user_id, reminder_sent_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_quotes_updated_at on public.quotes;

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

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default '',
  whatsapp_phone text not null default '',
  currency text not null default 'FCFA',
  reminder_delay_hours integer not null default 48,
  reminder_template text not null default 'Bonjour {{prospect}}, je me permets de vous relancer concernant le devis de {{amount}}.

Lien du devis : {{link}}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_reminder_delay_positive check (reminder_delay_hours > 0),
  constraint profiles_currency_not_blank check (length(trim(currency)) > 0)
);

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.quotes enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own quotes" on public.quotes;

create policy "Users can read their own quotes"
on public.quotes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own quotes" on public.quotes;

create policy "Users can create their own quotes"
on public.quotes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quotes" on public.quotes;

create policy "Users can update their own quotes"
on public.quotes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own quotes" on public.quotes;

create policy "Users can delete their own quotes"
on public.quotes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own profile" on public.profiles;

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "Users can upload their quote PDFs" on storage.objects;

create policy "Users can upload their quote PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read their quote PDFs" on storage.objects;

create policy "Users can read their quote PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their quote PDFs" on storage.objects;

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

drop policy if exists "Users can delete their quote PDFs" on storage.objects;

create policy "Users can delete their quote PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'quotes-pdf'
  and (storage.foldername(name))[1] = auth.uid()::text
);

do $$
declare
  admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
  admin_email text := 'admin@waquote.local';
  admin_password text := 'admin123';
begin
  select id
  into admin_user_id
  from auth.users
  where email = admin_email
  limit 1;

  admin_user_id := coalesce(admin_user_id, '00000000-0000-0000-0000-000000000001'::uuid);

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Administrateur WaQuote"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    admin_user_id,
    admin_user_id,
    admin_user_id::text,
    jsonb_build_object('sub', admin_user_id::text, 'email', admin_email),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  insert into public.profiles (
    user_id,
    company_name,
    whatsapp_phone,
    currency,
    reminder_delay_hours
  )
  values (
    admin_user_id,
    'WaQuote',
    '',
    'FCFA',
    48
  )
  on conflict (user_id) do update
  set
    company_name = excluded.company_name,
    currency = excluded.currency,
    reminder_delay_hours = excluded.reminder_delay_hours,
    updated_at = now();
end;
$$;
