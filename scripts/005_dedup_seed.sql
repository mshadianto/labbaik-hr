-- =====================================================================
-- HCMS · Seed Deduplication v2
-- =====================================================================
-- Cleanup script untuk dijalankan SETELAH 002_bootstrap_testers.sql,
-- terutama kalau script bootstrap-nya sempat di-run > 1x.
--
-- Bootstrap-nya untuk tabel leave_requests + announcements gak punya
-- ON CONFLICT (karena gak ada natural unique constraint), jadi re-run
-- bikin duplikat. Tabel lain (employees, attendance_logs, payroll_runs)
-- udah idempotent via ON CONFLICT — gak perlu di-dedup.
--
-- IDEMPOTENT: aman dijalankan berkali-kali. Kalau gak ada duplikat
-- tersisa, DELETE-nya no-op.
--
-- Kolom yang dipake (sudah diverifikasi dari migrations/001_initial_schema.sql):
--   leave_requests.created_at        — timestamptz default now()
--   leave_requests.employee_id       — uuid not null
--   leave_requests.leave_type        — enum
--   leave_requests.start_date        — date not null
--   announcements.published_at       — timestamptz default now()
--   announcements.title              — text not null
-- =====================================================================

-- ---------------------------------------------------------------------
-- BEFORE: Cek state awal
-- ---------------------------------------------------------------------
select 'BEFORE' as phase,
       (select count(*) from leave_requests) as leave_requests_total,
       (select count(*) from leave_requests
        where status = 'pending') as leave_requests_pending,
       (select count(*) from leave_requests) -
       (select count(distinct (employee_id, leave_type, start_date))
        from leave_requests) as leave_requests_dupes,
       (select count(*) from announcements) as announcements_total,
       (select count(*) from announcements) -
       (select count(distinct title) from announcements) as announcements_dupes;

-- ---------------------------------------------------------------------
-- STEP 1: Dedup leave_requests
-- Partisi by (employee_id, leave_type, start_date) — kombinasi ini
-- secara semantik harusnya unique (1 employee gak punya 2 leave_request
-- untuk leave_type yang sama di tanggal mulai yang sama).
-- Pertahankan baris paling lama (created_at asc).
-- ---------------------------------------------------------------------
do $$
declare
  v_deleted int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by employee_id, leave_type, start_date
             order by created_at asc, id asc
           ) as rn
    from leave_requests
  ),
  victims as (
    delete from leave_requests
    where id in (select id from ranked where rn > 1)
    returning 1
  )
  select count(*) into v_deleted from victims;

  raise notice 'STEP 1 · leave_requests: deleted % duplicate row(s)', v_deleted;
end $$;

-- ---------------------------------------------------------------------
-- STEP 2: Dedup announcements
-- Partisi by title — title-nya unique secara semantik di seed bootstrap.
-- Pertahankan baris paling lama (published_at asc).
-- ---------------------------------------------------------------------
do $$
declare
  v_deleted int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by title
             order by published_at asc, id asc
           ) as rn
    from announcements
  ),
  victims as (
    delete from announcements
    where id in (select id from ranked where rn > 1)
    returning 1
  )
  select count(*) into v_deleted from victims;

  raise notice 'STEP 2 · announcements: deleted % duplicate row(s)', v_deleted;
end $$;

-- ---------------------------------------------------------------------
-- AFTER: Verifikasi hasil
-- Expected: leave_requests_pending=5, announcements_total=4,
--           dupes columns harus 0.
-- ---------------------------------------------------------------------
select 'AFTER' as phase,
       (select count(*) from leave_requests) as leave_requests_total,
       (select count(*) from leave_requests
        where status = 'pending') as leave_requests_pending,
       (select count(*) from leave_requests) -
       (select count(distinct (employee_id, leave_type, start_date))
        from leave_requests) as leave_requests_dupes,
       (select count(*) from announcements) as announcements_total,
       (select count(*) from announcements) -
       (select count(distinct title) from announcements) as announcements_dupes;
