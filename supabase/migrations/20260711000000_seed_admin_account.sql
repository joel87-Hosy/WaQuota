create extension if not exists pgcrypto;

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
