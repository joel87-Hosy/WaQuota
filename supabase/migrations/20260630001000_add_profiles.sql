create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default '',
  whatsapp_phone text not null default '',
  currency text not null default 'FCFA',
  reminder_delay_hours integer not null default 48,
  reminder_template text not null default 'Bonjour {{prospect}}, je me permets de vous relancer concernant le devis de {{amount}}. Voici le lien : {{link}}',
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

alter table public.profiles enable row level security;

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
