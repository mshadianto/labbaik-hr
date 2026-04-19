-- =====================================================================
-- Labbaik HR · Bootstrap Tester Accounts
-- =====================================================================
-- Jalankan SETELAH migration 001_initial_schema.sql berhasil.
--
-- WORKFLOW:
--   1. Buat user auth dulu via Supabase Dashboard:
--      Authentication → Users → "Add user" (manual via email+password)
--   2. Setelah dapat UUID auth.users.id, paste di bagian LINK_AUTH_USERS
--      di bawah, atau gunakan fungsi helper di akhir file.
--
-- DEFAULT PASSWORD: TesterLabbaik2026! (ganti sebelum production!)
-- =====================================================================

-- ---------------------------------------------------------------------
-- STEP 1: Insert employee rows (tanpa auth_user_id dulu)
-- ---------------------------------------------------------------------

do $$
declare
  v_org_id       uuid;
  v_dir_sai_id   uuid;
  v_dir_keu_id   uuid;
  v_dir_inv_id   uuid;
  v_dir_ops_id   uuid;
  v_dir_it_id    uuid;
  v_dir_sdm_id   uuid;
  v_sopian_id    uuid;
  v_head_hr_id   uuid;
begin
  select id into v_org_id from organizations where code = 'BPKH';
  select id into v_dir_sai_id from directorates where code = 'SAI' and organization_id = v_org_id;
  select id into v_dir_keu_id from directorates where code = 'KEU' and organization_id = v_org_id;
  select id into v_dir_inv_id from directorates where code = 'INV' and organization_id = v_org_id;
  select id into v_dir_ops_id from directorates where code = 'OPS' and organization_id = v_org_id;
  select id into v_dir_it_id  from directorates where code = 'IT'  and organization_id = v_org_id;
  select id into v_dir_sdm_id from directorates where code = 'SDM' and organization_id = v_org_id;

  -- Super admin / owner
  insert into employees (nip, full_name, email, phone, organization_id, directorate_id,
                         position_title, role, join_date, base_salary, bank_account, leave_balance_annual)
  values ('BPKH-2024-0137', 'M. Sopian Hadianto', 'sopian@bpkh.go.id', '+628121234567',
          v_org_id, v_dir_sai_id, 'Anggota Komite Audit', 'super_admin',
          '2024-01-15', 27000000, 'BSI-7012345678', 12)
  on conflict (nip) do nothing
  returning id into v_sopian_id;

  -- Head of HR (approver)
  insert into employees (nip, full_name, email, phone, organization_id, directorate_id,
                         position_title, role, join_date, base_salary, bank_account)
  values ('BPKH-2020-0042', 'Siti Rahmawati', 'siti.rahmawati@bpkh.go.id', '+628129876543',
          v_org_id, v_dir_sdm_id, 'Kepala Divisi SDM', 'hr_admin',
          '2020-03-01', 22000000, 'BSI-7023456789')
  on conflict (nip) do nothing
  returning id into v_head_hr_id;
end $$;

-- ---------------------------------------------------------------------
-- STEP 2: 20 pegawai demo (full population)
-- ---------------------------------------------------------------------

with org as (select id from organizations where code = 'BPKH' limit 1),
     dirs as (
       select code, id from directorates
       where organization_id = (select id from org)
     ),
     hr_head as (select id from employees where nip = 'BPKH-2020-0042' limit 1),
     seed (nip, full_name, email, dir_code, position_title, role, base_salary) as (
       values
         ('BPKH-2021-0101', 'Ahmad Fauzi',        'ahmad.fauzi@bpkh.go.id',      'KEU', 'Analis Keuangan Senior',       'employee',  15000000),
         ('BPKH-2022-0102', 'Dewi Kartika',       'dewi.kartika@bpkh.go.id',     'INV', 'Investment Officer',           'employee',  16500000),
         ('BPKH-2019-0103', 'Rizky Pratama',      'rizky.pratama@bpkh.go.id',    'IT',  'Senior DevOps Engineer',       'employee',  18000000),
         ('BPKH-2023-0104', 'Nurul Fitri',        'nurul.fitri@bpkh.go.id',      'SAI', 'Internal Auditor',             'employee',  14000000),
         ('BPKH-2020-0105', 'Hendra Gunawan',     'hendra.gunawan@bpkh.go.id',   'OPS', 'Manajer Operasional Haji',     'approver',  20000000),
         ('BPKH-2022-0106', 'Rahma Aulia',        'rahma.aulia@bpkh.go.id',      'KEU', 'Staf Akuntansi',               'employee',  11000000),
         ('BPKH-2021-0107', 'Budi Santoso',       'budi.santoso@bpkh.go.id',     'INV', 'Portfolio Manager',            'employee',  17000000),
         ('BPKH-2023-0108', 'Siti Nurhaliza',     'siti.nurhaliza@bpkh.go.id',   'SDM', 'HR Business Partner',          'employee',  13000000),
         ('BPKH-2020-0109', 'Bambang Wijaya',     'bambang.wijaya@bpkh.go.id',   'SAI', 'Kepala Satuan Audit Internal', 'approver',  25000000),
         ('BPKH-2022-0110', 'Indah Permata',      'indah.permata@bpkh.go.id',    'IT',  'Software Engineer',            'employee',  14500000),
         ('BPKH-2019-0111', 'Yusuf Hamdan',       'yusuf.hamdan@bpkh.go.id',     'OPS', 'Staf Operasional',             'employee',  10500000),
         ('BPKH-2023-0112', 'Anisa Rahmadani',    'anisa.rahmadani@bpkh.go.id',  'KEU', 'Junior Analyst',               'employee',   9500000),
         ('BPKH-2021-0113', 'Taufik Hidayat',     'taufik.hidayat@bpkh.go.id',   'INV', 'Risk Analyst',                 'employee',  15500000),
         ('BPKH-2020-0114', 'Fatimah Zahra',      'fatimah.zahra@bpkh.go.id',    'SAI', 'Senior Auditor',               'employee',  17500000),
         ('BPKH-2022-0115', 'Agus Setiawan',      'agus.setiawan@bpkh.go.id',    'IT',  'Data Analyst',                 'employee',  13500000),
         ('BPKH-2019-0116', 'Wulandari Safitri',  'wulandari@bpkh.go.id',        'SDM', 'Training Specialist',          'employee',  12500000),
         ('BPKH-2023-0117', 'Reza Maulana',       'reza.maulana@bpkh.go.id',     'OPS', 'Staf Operasional',             'employee',  10000000),
         ('BPKH-2021-0118', 'Ayu Lestari',        'ayu.lestari@bpkh.go.id',      'INV', 'Compliance Officer',           'employee',  14000000),
         ('BPKH-2020-0119', 'Dian Kusuma',        'dian.kusuma@bpkh.go.id',      'KEU', 'Kepala Akuntansi',             'approver',  21000000),
         ('BPKH-2022-0120', 'Faisal Akbar',       'faisal.akbar@bpkh.go.id',     'SAI', 'Auditor IT',                   'employee',  15000000)
     )
insert into employees (nip, full_name, email, organization_id, directorate_id,
                       position_title, role, supervisor_id, base_salary, join_date,
                       leave_balance_annual, bank_account)
select s.nip, s.full_name, s.email,
       (select id from org),
       (select id from dirs where code = s.dir_code),
       s.position_title, s.role::user_role,
       (select id from hr_head),
       s.base_salary,
       '2020-01-01'::date + (random() * 1000)::int,
       12,
       'BSI-' || (7030000000 + (row_number() over ())::int)::text
from seed s
on conflict (nip) do nothing;

-- ---------------------------------------------------------------------
-- STEP 3: Assign supervisors (Kepala Divisi → staff)
-- ---------------------------------------------------------------------

-- Kepala SAI (Bambang) → supervise SAI staff
update employees set supervisor_id = (select id from employees where nip = 'BPKH-2020-0109')
where directorate_id = (select id from directorates where code = 'SAI')
  and nip not in ('BPKH-2020-0109', 'BPKH-2024-0137');

-- Kepala Akuntansi (Dian) → supervise KEU staff
update employees set supervisor_id = (select id from employees where nip = 'BPKH-2020-0119')
where directorate_id = (select id from directorates where code = 'KEU')
  and nip != 'BPKH-2020-0119';

-- Manajer Ops (Hendra) → supervise OPS staff
update employees set supervisor_id = (select id from employees where nip = 'BPKH-2020-0105')
where directorate_id = (select id from directorates where code = 'OPS')
  and nip != 'BPKH-2020-0105';

-- Sopian (super_admin) → no supervisor
update employees set supervisor_id = null where nip = 'BPKH-2024-0137';

-- ---------------------------------------------------------------------
-- STEP 4: Seed attendance logs (14 hari terakhir, ~90% kehadiran)
-- ---------------------------------------------------------------------

insert into attendance_logs (employee_id, work_date, clock_in_at, clock_in_lat, clock_in_lng,
                             clock_in_distance_m, clock_in_face_score, clock_in_liveness_passed,
                             status, late_minutes)
select e.id,
       d::date,
       (d::date + time '08:00' + (random() * interval '60 minutes'))::timestamptz,
       -6.2247156 + (random() - 0.5) * 0.0005,
       106.8300092 + (random() - 0.5) * 0.0005,
       (random() * 80 + 20)::int,
       0.85 + random() * 0.14,
       true,
       case when random() < 0.88 then 'present'::attendance_status
            when random() < 0.95 then 'late'::attendance_status
            else 'absent'::attendance_status end,
       greatest(0, (random() * 30 - 15)::int)
from employees e
cross join generate_series(current_date - interval '14 days', current_date - interval '1 day', interval '1 day') d
where e.active = true
  and extract(dow from d) not in (0, 6)  -- skip weekend
  and random() < 0.90                    -- 90% hadir
on conflict (employee_id, work_date) do nothing;

-- ---------------------------------------------------------------------
-- STEP 5: Seed pending leave requests (butuh approval)
-- ---------------------------------------------------------------------

insert into leave_requests (employee_id, leave_type, start_date, end_date, reason, approver_id, status)
values
  ((select id from employees where nip = 'BPKH-2021-0101'),
   'tahunan', current_date + 2, current_date + 4,
   'Acara keluarga di Samarinda',
   (select supervisor_id from employees where nip = 'BPKH-2021-0101'),
   'pending'),
  ((select id from employees where nip = 'BPKH-2022-0102'),
   'dinas', current_date + 7, current_date + 11,
   'Kunjungan BPKH Limited Mekkah - audit on-site Q2',
   (select supervisor_id from employees where nip = 'BPKH-2022-0102'),
   'pending'),
  ((select id from employees where nip = 'BPKH-2023-0104'),
   'umrah', current_date + 14, current_date + 27,
   'Ibadah umrah bersama orang tua',
   (select supervisor_id from employees where nip = 'BPKH-2023-0104'),
   'pending'),
  ((select id from employees where nip = 'BPKH-2020-0105'),
   'sakit', current_date - 1, current_date,
   'Demam dan flu (lampiran surat dokter)',
   (select id from employees where nip = 'BPKH-2020-0042'),
   'pending'),
  ((select id from employees where nip = 'BPKH-2019-0111'),
   'haji', current_date + 60, current_date + 95,
   'Ibadah haji (porsi keberangkatan 2026)',
   (select id from employees where nip = 'BPKH-2020-0105'),
   'pending');

-- ---------------------------------------------------------------------
-- STEP 6: Seed announcements
-- ---------------------------------------------------------------------

insert into announcements (title, body, category, audience, created_by)
select t, b, c, 'all', (select id from employees where nip = 'BPKH-2020-0042')
from (values
  ('Rapat Komite Audit Triwulan I/2026',
   'Agenda: pembahasan performance memo & war-ticket policy. Senin, 21 April 2026 · Ruang Dewas Lt. 16.',
   'dewas'),
  ('Pelatihan GRC & ISO 37001 Angkatan VII',
   'Pendaftaran dibuka s.d. 25 April 2026. Tersedia 30 kursi untuk pegawai level staf ke atas. Daftar via Menu Pelatihan.',
   'hr'),
  ('Penyesuaian Jadwal Kerja Ramadan 1447 H',
   'Periode Ramadan: jam kerja 08.00-15.00, istirahat 12.00-12.30. Efektif sejak 1 Ramadan hingga 29 Ramadan.',
   'hr'),
  ('Pengingat: Slip Gaji April Tersedia 24 April',
   'Slip gaji elektronik dapat diunduh di menu Slip Gaji mulai tanggal 24 April 2026, H-1 tanggal transfer (25 April).',
   'hr')
) as a(t, b, c);

-- ---------------------------------------------------------------------
-- STEP 7: Seed announcement untuk jadwal payroll
-- ---------------------------------------------------------------------

insert into payroll_runs (period_month, period_year, cutoff_date, payment_date, status,
                          total_gross, total_net)
values (4, 2026, '2026-04-20', '2026-04-25', 'draft', 4820000000, 4235000000)
on conflict (period_year, period_month) do nothing;

-- ---------------------------------------------------------------------
-- LINK_AUTH_USERS
-- ---------------------------------------------------------------------
-- Setelah buat user via Supabase Dashboard → Authentication → Users,
-- copy UUID-nya dan paste di sini:

-- update employees set auth_user_id = 'PASTE-UUID-HERE'
-- where nip = 'BPKH-2024-0137';

-- Helper: auto-link by email (if auth user with matching email already exists)
create or replace function auto_link_auth_by_email()
returns table (nip text, email text, auth_uid uuid) as $$
  update employees e
  set auth_user_id = u.id
  from auth.users u
  where e.email = u.email
    and e.auth_user_id is null
  returning e.nip, e.email, u.id;
$$ language sql;

-- Setelah buat auth users di Dashboard, jalankan:
-- select * from auto_link_auth_by_email();

-- ---------------------------------------------------------------------
-- Verifikasi seed
-- ---------------------------------------------------------------------
select
  (select count(*) from employees where active = true) as total_employees,
  (select count(*) from attendance_logs) as attendance_records,
  (select count(*) from leave_requests where status = 'pending') as pending_leaves,
  (select count(*) from announcements) as announcements,
  (select count(*) from directorates) as directorates,
  (select count(*) from office_locations) as office_locations;
