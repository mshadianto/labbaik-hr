# Labbaik HR · Quickstart Guide

Panduan end-to-end dari nol sampai aplikasi live dan bisa di-demo.

---

## Prasyarat

- [x] Akun Supabase hosted (project `hgicneixmefbmxplktfb`)
- [x] Akun Groq (https://console.groq.com) untuk Tanya HR — gratis 30 req/menit
- [x] Akun Jina AI (https://jina.ai) untuk embedding — gratis 1M token/bulan
- [x] Node.js 20+, Python 3.11+, Git
- [ ] Domain `hcms.mshadianto.id` (sudah dipasang ke GitHub Pages)
- [ ] VPS untuk hosting FastAPI di `api.mshadianto.id` (opsional, hanya untuk fitur face-match & Tanya HR)

---

## Sprint 0 · Local setup (30 menit)

### 1. Jalankan schema di Supabase

Buka https://supabase.com/dashboard/project/hgicneixmefbmxplktfb → **SQL Editor** → **New query**

Paste & Run berurutan:

1. `backend/migrations/001_initial_schema.sql` — schema dasar + RLS
2. `scripts/003_rag_query_function.sql` — fungsi match_hr_knowledge
3. `scripts/002_bootstrap_testers.sql` — 20 pegawai demo + pending approvals

Verifikasi di bagian bawah query terakhir — harus muncul tabel hasil count.

### 2. Buat auth users di Supabase

Dashboard → **Authentication → Users → Add user**

Buat beberapa akun awal (pakai email yang sama dengan seed):

| Email | Password | Peran |
|---|---|---|
| `sopian@bpkh.go.id` | `TesterLabbaik2026!` | super_admin |
| `siti.rahmawati@bpkh.go.id` | `TesterLabbaik2026!` | hr_admin |
| `ahmad.fauzi@bpkh.go.id` | `TesterLabbaik2026!` | employee |

Lalu jalankan di SQL Editor:

```sql
select * from auto_link_auth_by_email();
```

Ini otomatis menghubungkan `auth.users.id` ke `employees.auth_user_id`.

### 3. Setup backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env   # isi SUPABASE_SERVICE_KEY + GROQ_API_KEY
```

Ambil **service_role key** di Dashboard Supabase → **Settings → API → service_role key** (warning: jangan commit!)

Ambil **Groq API key** di https://console.groq.com/keys

Jalankan:

```bash
uvicorn app.main:app --reload --port 8000
```

Buka http://localhost:8000/docs — dokumentasi OpenAPI otomatis tersedia.

### 4. Ingest knowledge base (Tanya HR RAG)

```bash
# Dari root project
export SUPABASE_URL=https://hgicneixmefbmxplktfb.supabase.co
export SUPABASE_SERVICE_KEY=<paste>
export JINA_API_KEY=<paste dari jina.ai>

python scripts/ingest_rag.py
```

Output: 14 chunks Perka BPKH & SOP ter-embed ke pgvector. Proses ~30 detik.

### 5. Setup employee frontend

```bash
cd frontend-employee
npm install

cp .env.example .env
# isi VITE_SUPABASE_ANON_KEY (dari Dashboard → Settings → API → anon public)

# Download face-api.js models (~6MB)
bash ../scripts/download_face_models.sh

npm run dev
```

Buka http://localhost:5173 — login dengan akun tester di atas.

**Test flow:**
1. Login sebagai `ahmad.fauzi@bpkh.go.id`
2. Klik "Enroll Wajah" dulu di menu Profil (wajib sebelum bisa clock-in)
3. Ke Beranda → Clock In → allow GPS + camera → blink 2x → done

### 6. Setup admin frontend

```bash
cd frontend-admin
npm install
npm run dev -- --port 5174
```

Buka http://localhost:5174 — login sebagai `siti.rahmawati@bpkh.go.id`.

Anda akan lihat:
- Dashboard dengan stats real dari Supabase
- Approval Queue dengan 5 pending leaves
- Audit Trail dengan log dari clock-in tadi

---

## Sprint 1 · Deploy ke VPS SumoPod

### 1. Push repo ke GitHub

```bash
cd /path/to/labbaik-hr
git init
git add .
git commit -m "Initial: Labbaik HR monorepo v1.0"
git branch -M main
git remote add origin https://github.com/mshadianto/labbaik-hr.git
git push -u origin main
```

### 2. SSH ke VPS & jalankan installer

```bash
ssh user@43.128.106.71
sudo bash
curl -fsSL https://raw.githubusercontent.com/mshadianto/labbaik-hr/main/deploy/install.sh | bash
```

Script akan:
- Install dependencies (Python, Node, Nginx, Certbot)
- Clone repo ke `/opt/labbaik-hr`
- Setup Python venv & install deps
- Build kedua frontend
- Copy Nginx configs
- Install systemd service
- Setup firewall

### 3. Configure production env

```bash
# Backend
sudo -u labbaik nano /opt/labbaik-hr/backend/.env
# isi: SUPABASE_SERVICE_KEY, GROQ_API_KEY

# Employee frontend
sudo -u labbaik nano /opt/labbaik-hr/frontend-employee/.env
# isi: VITE_SUPABASE_ANON_KEY, VITE_API_URL=https://api.labbaik.bpkh.go.id

# Admin frontend
sudo -u labbaik nano /opt/labbaik-hr/frontend-admin/.env
# isi sama seperti di atas

# Rebuild
cd /opt/labbaik-hr/frontend-employee && sudo -u labbaik npm run build
cp -r dist/* /var/www/labbaik.bpkh.go.id/

cd /opt/labbaik-hr/frontend-admin && sudo -u labbaik npm run build
cp -r dist/* /var/www/admin.labbaik.bpkh.go.id/
```

### 4. Arahkan DNS

Di DNS provider Anda (Cloudflare / Niagahoster / dll), buat A record:

```
labbaik.bpkh.go.id       A   43.128.106.71
admin.labbaik.bpkh.go.id A   43.128.106.71
api.labbaik.bpkh.go.id   A   43.128.106.71
```

Tunggu propagasi (5–30 menit).

### 5. SSL certs

```bash
certbot --nginx -d labbaik.bpkh.go.id -d admin.labbaik.bpkh.go.id -d api.labbaik.bpkh.go.id
# Auto-renewal sudah aktif via cron
```

### 6. Start services

```bash
systemctl start labbaik-hr-api
systemctl reload nginx

# Monitor
journalctl -u labbaik-hr-api -f
```

Aplikasi live di:
- **Employee**: https://labbaik.bpkh.go.id
- **Admin**: https://admin.labbaik.bpkh.go.id
- **API**: https://api.labbaik.bpkh.go.id/docs

---

## Sprint 2+ · Roadmap

- [ ] **SSO Active Directory BPKH** — via Supabase SAML/OIDC
- [ ] **Multi-entitas** — routing BPKH Limited (AST timezone) + Bank Muamalat
- [ ] **Mobile native** — Capacitor wrapper, push notif via FCM
- [ ] **Offline clock-in queue** — IndexedDB + sync saat reconnect
- [ ] **Payroll BSI export** — generate file bank transfer bulanan
- [ ] **Ramadan schedule auto-adjust** — detect Ramadan via Hijri calc
- [ ] **Anomaly detection** — flagging clock-in aneh (same face enroll dari device berbeda, dll.)

---

## Troubleshooting umum

### "Face models gagal load"
```bash
# Pastikan folder /models accessible
curl http://localhost:5173/models/tiny_face_detector_model-weights_manifest.json
# Kalau 404, rerun:
bash scripts/download_face_models.sh
```

### "RLS blocking queries"
```bash
# Pastikan auth_user_id ter-link
# Di SQL editor:
select nip, auth_user_id from employees where email = 'your@email.com';
# Kalau null, run:
select * from auto_link_auth_by_email();
```

### "Face match selalu gagal"
- Pastikan user sudah enroll wajah duluan (`/api/face/enroll`)
- Cek quality score saat enroll (minimum 0.7)
- Threshold di backend: `FACE_MATCH_THRESHOLD = 0.62` — bisa diturunkan ke 0.55 untuk demo

### "Geofence di luar kantor padahal sudah di kantor"
- GPS indoor sering drift — cek `navigator.geolocation` accuracy
- Naikkan radius di `office_locations.radius_meters` dari 150 ke 250m
- Atau gunakan WiFi BSSID matching sebagai fallback

---

## Security checklist pre-launch

- [ ] Rotate `service_role` key kalau pernah bocor (termasuk di chat)
- [ ] Aktifkan **2FA** di Supabase dashboard
- [ ] Test RLS: login sebagai staff biasa, pastikan tidak bisa lihat data pegawai lain
- [ ] Verify audit trail hash chain: `select * from audit_events order by id limit 10;` — setiap `prev_hash` harus match `event_hash` baris sebelumnya
- [ ] Enable **IP allowlist** di nginx admin kalau mau restrict ke IP kantor
- [ ] Install **fail2ban** jail untuk SSH & Nginx
- [ ] Setup backup Supabase harian (Settings → Database → Backups)
- [ ] Dokumentasikan **incident response** — siapa yang dihubungi kalau ada breach

---

_Dibangun dengan tekad "Curious → Coding → Deploy → Repeat"._
_Untuk pertanyaan: sopian@bpkh.go.id_
