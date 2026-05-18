-- =====================================================================
-- HCMS · Seed Deduplication
-- =====================================================================
-- Cleanup script untuk dijalankan SETELAH 002_bootstrap_testers.sql kalau
-- script itu sempat di-run > 1x. Bootstrap untuk leave_requests dan
-- announcements gak punya ON CONFLICT, jadi re-run bikin duplikat.
--
-- Tabel lain (employees, attendance_logs, payroll_runs) udah idempotent
-- via ON CONFLICT — gak perlu di-dedup.
--
-- IDEMPOTENT: aman dijalankan berkali-kali. Kalau gak ada duplikat,
-- DELETE-nya no-op.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BEFORE: inspect (jalankan dulu untuk konfirmasi ada duplikat)
-- ---------------------------------------------------------------------
-- select 'leave_requests' as table_name, count(*) as total,
--        count(*) - count(distinct (employee_id, leave_type, start_date)) as duplicates
-- from leave_requests
-- union all
-- select 'announcements', count(*),
--        count(*) - count(distinct title)
-- from announcements;

-- ---------------------------------------------------------------------
-- STEP 1: Dedup leave_requests
-- Keep oldest row per (employee_id, leave_type, start_date)
-- ---------------------------------------------------------------------
with ranked as (
  select id,
         row_number() over (
           partition by employee_id, leave_type, start_date
           order by created_at asc, id asc
         ) as rn
  from leave_requests
)
delete from leave_requests
where id in (select id from ranked where rn > 1);

-- ---------------------------------------------------------------------
-- STEP 2: Dedup announcements
-- Keep oldest row per title (table has published_at, not created_at)
-- ---------------------------------------------------------------------
with ranked as (
  select id,
         row_number() over (
           partition by title
           order by published_at asc, id asc
         ) as rn
  from announcements
)
delete from announcements
where id in (select id from ranked where rn > 1);

-- ---------------------------------------------------------------------
-- AFTER: verifikasi (harus 5 leave_requests, 4 announcements)
-- ---------------------------------------------------------------------
select
  (select count(*) from leave_requests where status = 'pending') as pending_leaves,
  (select count(*) from announcements) as announcements;
