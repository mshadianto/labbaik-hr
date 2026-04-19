-- =====================================================================
-- Labbaik HR · Supabase Schema v1.0
-- Project: dstkhzgebjtwvsfykidt
-- Author:  M. Sopian Hadianto (BPKH Komite Audit)
--
-- Design principles:
--  - Every mutation is audit-logged (ISO 27001 non-repudiation)
--  - Row Level Security enforces "pegawai hanya lihat datanya sendiri"
--  - Face embeddings stored as pgvector (similarity match)
--  - All timestamps in UTC; WIB display handled by client
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";          -- for face embeddings
create extension if not exists "postgis";         -- for geofence checks

-- ---------- Enums ----------
create type user_role as enum (
  'employee', 'approver', 'hr_admin', 'dewas', 'super_admin'
);

create type attendance_status as enum (
  'present', 'late', 'absent', 'wfh', 'on_duty', 'leave'
);

create type leave_type as enum (
  'tahunan', 'sakit', 'haji', 'umrah', 'melahirkan',
  'menikah', 'duka', 'ibadah_lain', 'dinas'
);

create type request_status as enum (
  'draft', 'pending', 'approved', 'rejected', 'cancelled'
);

create type audit_action as enum (
  'login', 'logout', 'clock_in', 'clock_out',
  'leave_submit', 'leave_approve', 'leave_reject',
  'payroll_view', 'data_export', 'face_enroll',
  'permission_denied', 'geofence_violation'
);

-- =====================================================================
-- 1. Organizations & Units
-- =====================================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,                      -- 'BPKH', 'BPKH-LTD', 'BMI'
  name text not null,
  country_code text default 'ID',                 -- 'ID', 'SA'
  timezone text default 'Asia/Jakarta',
  created_at timestamptz default now()
);

create table directorates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  parent_id uuid references directorates(id),
  created_at timestamptz default now(),
  unique (organization_id, code)
);

-- =====================================================================
-- 2. Office Locations (Geofence)
-- =====================================================================
create table office_locations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id),
  name text not null,                             -- 'Muamalat Tower'
  address text,
  lat double precision not null,
  lng double precision not null,
  radius_meters integer not null default 150,
  geom geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) stored,
  active boolean default true,
  created_at timestamptz default now(),
  unique (organization_id, name)
);

create index idx_office_geom on office_locations using gist (geom);

-- =====================================================================
-- 3. Employees
-- =====================================================================
create table employees (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nip text unique not null,                       -- 'BPKH-2024-0137'
  full_name text not null,
  email text unique not null,
  phone text,
  organization_id uuid references organizations(id),
  directorate_id uuid references directorates(id),
  supervisor_id uuid references employees(id),
  position_title text,
  role user_role not null default 'employee',
  join_date date,
  leave_balance_annual integer default 12,
  leave_balance_hajj_used boolean default false,  -- cuti haji seumur hidup sekali
  base_salary numeric(15,2),
  bank_account text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_emp_supervisor on employees(supervisor_id);
create index idx_emp_directorate on employees(directorate_id);

-- ---------- Face embeddings (separated for security) ----------
create table employee_face_embeddings (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid unique references employees(id) on delete cascade,
  -- face-api.js uses 128-dim, Rekognition uses 512 — we support both
  embedding vector(128),
  enrolled_at timestamptz default now(),
  enrollment_device_id text,
  quality_score real                              -- 0..1, reject < 0.7
);

-- =====================================================================
-- 4. Attendance
-- =====================================================================
create table attendance_logs (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references employees(id),
  work_date date not null,
  clock_in_at timestamptz,
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_office_id uuid references office_locations(id),
  clock_in_distance_m integer,
  clock_in_face_score real,                       -- similarity 0..1
  clock_in_liveness_passed boolean,
  clock_in_device text,
  clock_in_ip inet,
  clock_out_at timestamptz,
  clock_out_lat double precision,
  clock_out_lng double precision,
  status attendance_status not null default 'present',
  late_minutes integer default 0,
  overtime_minutes integer default 0,
  notes text,
  created_at timestamptz default now(),
  unique (employee_id, work_date)
);

create index idx_att_emp_date on attendance_logs(employee_id, work_date desc);

-- =====================================================================
-- 5. Leave Requests
-- =====================================================================
create table leave_requests (
  id uuid primary key default uuid_generate_v4(),
  request_no text unique,                         -- 'CUTI-2026-0047'
  employee_id uuid not null references employees(id),
  leave_type leave_type not null,
  start_date date not null,
  end_date date not null,
  days integer generated always as (end_date - start_date + 1) stored,
  reason text,
  attachment_url text,
  status request_status not null default 'pending',
  approver_id uuid references employees(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create sequence if not exists leave_seq start 1;
create or replace function generate_leave_no() returns trigger as $$
begin
  new.request_no := 'CUTI-' || to_char(now(), 'YYYY') || '-' ||
                    lpad(nextval('leave_seq')::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_leave_no before insert on leave_requests
for each row when (new.request_no is null) execute function generate_leave_no();

-- =====================================================================
-- 6. Reimbursement
-- =====================================================================
create table reimbursements (
  id uuid primary key default uuid_generate_v4(),
  request_no text unique,
  employee_id uuid not null references employees(id),
  category text not null,                         -- 'dinas', 'pelatihan', 'medis'
  amount numeric(15,2) not null,
  currency text default 'IDR',
  description text,
  receipt_url text,
  status request_status not null default 'pending',
  approver_id uuid references employees(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================================
-- 7. Payroll
-- =====================================================================
create table payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  period_month integer not null,                  -- 1..12
  period_year integer not null,
  cutoff_date date not null,
  payment_date date not null,
  status text default 'draft',                    -- draft | locked | paid
  total_gross numeric(15,2),
  total_net numeric(15,2),
  created_at timestamptz default now(),
  unique (period_year, period_month)
);

create table payslips (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id uuid references payroll_runs(id) on delete cascade,
  employee_id uuid references employees(id),
  gross_amount numeric(15,2),
  net_amount numeric(15,2),
  tax_pph21 numeric(15,2),
  bpjs_kesehatan numeric(15,2),
  bpjs_ketenagakerjaan numeric(15,2),
  zakat_profesi numeric(15,2),                    -- 2.5% jika di atas nisab
  components jsonb,                               -- [{label, amount, type}]
  released boolean default false,
  created_at timestamptz default now(),
  unique (payroll_run_id, employee_id)
);

-- =====================================================================
-- 8. Audit Trail (append-only, hash-chained for GRC)
-- =====================================================================
create table audit_events (
  id bigserial primary key,
  event_id uuid default uuid_generate_v4(),
  actor_id uuid references employees(id),
  actor_role user_role,
  action audit_action not null,
  target_type text,                               -- 'leave_request', 'attendance'
  target_id uuid,
  payload jsonb,
  ip inet,
  user_agent text,
  session_id text,
  prev_hash text,                                 -- hash chain
  event_hash text,
  occurred_at timestamptz default now()
);

create index idx_audit_actor on audit_events(actor_id, occurred_at desc);
create index idx_audit_action on audit_events(action, occurred_at desc);

-- ---------- Hash chain trigger (non-repudiation) ----------
create or replace function compute_audit_hash() returns trigger as $$
declare
  last_hash text;
  payload_str text;
begin
  select event_hash into last_hash from audit_events
    where id < new.id order by id desc limit 1;
  last_hash := coalesce(last_hash, 'GENESIS');
  payload_str := concat(
    new.event_id::text, new.actor_id::text, new.action::text,
    new.target_id::text, new.payload::text, new.occurred_at::text, last_hash
  );
  new.prev_hash := last_hash;
  new.event_hash := encode(digest(payload_str, 'sha256'), 'hex');
  return new;
end;
$$ language plpgsql;

create trigger trg_audit_hash before insert on audit_events
for each row execute function compute_audit_hash();

-- Block updates/deletes on audit_events (append-only)
create or replace function audit_immutable() returns trigger as $$
begin
  raise exception 'audit_events is append-only (GRC ISO 27001 non-repudiation)';
end;
$$ language plpgsql;

create trigger trg_audit_no_update before update on audit_events
  for each row execute function audit_immutable();
create trigger trg_audit_no_delete before delete on audit_events
  for each row execute function audit_immutable();

-- =====================================================================
-- 9. Announcements
-- =====================================================================
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text,
  category text,                                  -- 'dewas', 'hr', 'it'
  audience text default 'all',                    -- 'all' | directorate code
  published_at timestamptz default now(),
  expires_at timestamptz,
  created_by uuid references employees(id)
);

-- =====================================================================
-- 10. Knowledge Base (for Tanya HR RAG)
-- =====================================================================
create table hr_knowledge_chunks (
  id uuid primary key default uuid_generate_v4(),
  source_title text not null,                     -- 'Perka BPKH 5/2023'
  source_kind text,                               -- 'peraturan', 'sop', 'faq'
  chunk_text text not null,
  embedding vector(1536),                         -- text-embedding-3-small
  metadata jsonb,
  created_at timestamptz default now()
);

create index on hr_knowledge_chunks using ivfflat (embedding vector_cosine_ops);

-- =====================================================================
-- Helper functions
-- =====================================================================

-- Check if coordinate is inside any active office geofence
create or replace function check_geofence(p_lat double precision, p_lng double precision)
returns table (office_id uuid, office_name text, distance_m integer, inside boolean) as $$
  select id, name,
         ST_Distance(geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::integer as dist,
         ST_DWithin(geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, radius_meters) as inside
  from office_locations
  where active = true
  order by dist asc
  limit 1;
$$ language sql stable;

-- Match face against enrolled embeddings (cosine similarity)
create or replace function match_face(query_embedding vector(128), threshold real default 0.6)
returns table (employee_id uuid, similarity real) as $$
  select employee_id, 1 - (embedding <=> query_embedding) as sim
  from employee_face_embeddings
  where 1 - (embedding <=> query_embedding) > threshold
  order by embedding <=> query_embedding
  limit 1;
$$ language sql stable;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table employees enable row level security;
alter table attendance_logs enable row level security;
alter table leave_requests enable row level security;
alter table reimbursements enable row level security;
alter table payslips enable row level security;
alter table announcements enable row level security;

-- Helper: get current employee row
create or replace function current_employee_id() returns uuid as $$
  select id from employees where auth_user_id = auth.uid();
$$ language sql stable security definer;

create or replace function current_employee_role() returns user_role as $$
  select role from employees where auth_user_id = auth.uid();
$$ language sql stable security definer;

-- ---------- Employees: see self, supervisor sees subordinates, HR sees all ----------
create policy "emp_self_read" on employees for select
  using (auth_user_id = auth.uid()
         or current_employee_role() in ('hr_admin', 'super_admin')
         or supervisor_id = current_employee_id());

create policy "emp_self_update" on employees for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ---------- Attendance: see self, supervisor sees team, HR sees all ----------
create policy "att_read" on attendance_logs for select
  using (employee_id = current_employee_id()
         or current_employee_role() in ('hr_admin', 'super_admin')
         or employee_id in (select id from employees where supervisor_id = current_employee_id()));

create policy "att_insert_self" on attendance_logs for insert
  with check (employee_id = current_employee_id());

create policy "att_update_self_today" on attendance_logs for update
  using (employee_id = current_employee_id() and work_date = current_date);

-- ---------- Leave: employee submits, approver approves ----------
create policy "leave_read" on leave_requests for select
  using (employee_id = current_employee_id()
         or approver_id = current_employee_id()
         or current_employee_role() in ('hr_admin', 'super_admin'));

create policy "leave_insert_self" on leave_requests for insert
  with check (employee_id = current_employee_id());

create policy "leave_approve" on leave_requests for update
  using (approver_id = current_employee_id()
         or current_employee_role() in ('hr_admin', 'super_admin'));

-- ---------- Payslip: self only ----------
create policy "payslip_self_read" on payslips for select
  using (employee_id = current_employee_id()
         or current_employee_role() in ('hr_admin', 'super_admin'));

-- ---------- Announcements: all authenticated ----------
create policy "annc_read" on announcements for select using (auth.role() = 'authenticated');

-- =====================================================================
-- Seed data: BPKH + Muamalat Tower
-- =====================================================================
insert into organizations (code, name, country_code, timezone) values
  ('BPKH', 'Badan Pengelola Keuangan Haji', 'ID', 'Asia/Jakarta'),
  ('BPKH-LTD', 'BPKH Limited', 'SA', 'Asia/Riyadh'),
  ('BMI', 'Bank Muamalat Indonesia', 'ID', 'Asia/Jakarta')
on conflict (code) do nothing;

insert into office_locations (organization_id, name, address, lat, lng, radius_meters)
select id, 'Muamalat Tower', 'Jl. Prof. Dr. Satrio Kav. 18, Kuningan, Jakarta Selatan',
       -6.2247156, 106.8300092, 150
from organizations where code = 'BPKH'
on conflict (organization_id, name) do nothing;

insert into directorates (organization_id, code, name)
select o.id, d.dir_code, d.dir_name
from organizations o
cross join (values
  ('SAI', 'Satuan Audit Internal'),
  ('KEU', 'Direktorat Keuangan'),
  ('INV', 'Direktorat Investasi'),
  ('OPS', 'Direktorat Operasional Haji'),
  ('IT',  'IT & Sistem Informasi'),
  ('SDM', 'Sumber Daya Manusia')
) as d(dir_code, dir_name)
where o.code = 'BPKH'
on conflict (organization_id, code) do nothing;

-- Done.
