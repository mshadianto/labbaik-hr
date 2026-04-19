-- =====================================================================
-- Labbaik HR · Gelombang 1: Auth Users Bootstrap
-- =====================================================================
-- Buat 3 akun tester + auto-link ke employees dalam satu query.
-- Password default: TesterLabbaik2026! (HASH sudah di-generate dengan bcrypt)
--
-- PENTING:
-- 1. Ganti password via Supabase Dashboard setelah first login
-- 2. Script ini pakai `crypt()` dari extension pgcrypto (sudah enable di schema)
-- =====================================================================

-- Helper function untuk create auth user (Supabase-compatible)
-- Referensi: https://github.com/supabase/auth/blob/master/internal/models/user.go
create or replace function create_tester_auth(
  p_email text,
  p_password text
) returns uuid as $$
declare
  v_user_id uuid := uuid_generate_v4();
  v_encrypted_pw text;
begin
  -- Skip kalau user sudah ada
  select id into v_user_id from auth.users where email = p_email;
  if found then
    return v_user_id;
  end if;

  v_user_id := uuid_generate_v4();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(), now(), '', '', '', ''
  );

  -- Create identity record (required for Supabase Auth)
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id, v_user_id,
    format('{"sub":"%s","email":"%s","email_verified":true}', v_user_id::text, p_email)::jsonb,
    'email',
    v_user_id::text,
    now(), now(), now()
  );

  return v_user_id;
end;
$$ language plpgsql security definer;

-- =====================================================================
-- Buat 3 akun tester utama
-- =====================================================================

select create_tester_auth('sopian@bpkh.go.id',         'TesterLabbaik2026!') as sopian_uid;
select create_tester_auth('siti.rahmawati@bpkh.go.id', 'TesterLabbaik2026!') as siti_uid;
select create_tester_auth('ahmad.fauzi@bpkh.go.id',    'TesterLabbaik2026!') as ahmad_uid;

-- =====================================================================
-- Bonus: buat akun untuk SEMUA 22 pegawai sekaligus
-- (semua password sama: TesterLabbaik2026!)
-- =====================================================================

do $$
declare
  r record;
  v_uid uuid;
begin
  for r in select email from employees where email is not null and auth_user_id is null
  loop
    v_uid := create_tester_auth(r.email, 'TesterLabbaik2026!');
    update employees set auth_user_id = v_uid where email = r.email;
  end loop;
end $$;

-- =====================================================================
-- Verifikasi
-- =====================================================================
select
  e.nip,
  e.full_name,
  e.role,
  e.email,
  case when e.auth_user_id is not null then '✓' else '✗' end as linked,
  case when u.email_confirmed_at is not null then '✓' else '✗' end as confirmed
from employees e
left join auth.users u on u.id = e.auth_user_id
order by e.role desc, e.nip
limit 25;

-- Cleanup helper function (optional — bisa dipakai untuk add tester lain nanti)
-- drop function if exists create_tester_auth;
