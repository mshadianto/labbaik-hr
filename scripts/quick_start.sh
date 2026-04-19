#!/usr/bin/env bash
# =============================================================
# Labbaik HR · Quick Local Setup
# =============================================================
# Bootstrap local development environment in one command:
#   bash scripts/quick_start.sh
# =============================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "════════════════════════════════════════════════════════"
echo "  Labbaik HR · Quick Start"
echo "════════════════════════════════════════════════════════"
echo ""

# ---------- 1. Check prerequisites ----------
echo "▸ Checking prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo "✗ python3 missing"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "✗ node missing"; exit 1; }
echo "  ✓ python3: $(python3 --version)"
echo "  ✓ node:    $(node --version)"
echo ""

# ---------- 2. Backend setup ----------
echo "▸ Setting up backend..."
cd "$ROOT_DIR/backend"

if [[ ! -d "venv" ]]; then
  echo "  Creating venv..."
  python3 -m venv venv
fi

source venv/bin/activate
echo "  Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [[ ! -f ".env" ]]; then
  echo ""
  echo "  ⚠ .env belum ada. Saya buat dari template."
  cp .env.example .env
  echo ""
  echo "  ══════════════════════════════════════════════════════"
  echo "  WAJIB: Edit backend/.env sekarang, isi:"
  echo "    SUPABASE_SERVICE_KEY=... (dari Dashboard → Settings → API)"
  echo "    GROQ_API_KEY=... (dari console.groq.com/keys)"
  echo "  ══════════════════════════════════════════════════════"
  echo ""
  read -p "  Tekan ENTER setelah .env selesai diisi..."
fi

# ---------- 3. Frontend employee setup ----------
echo ""
echo "▸ Setting up frontend-employee..."
cd "$ROOT_DIR/frontend-employee"

if [[ ! -d "node_modules" ]]; then
  echo "  npm install (ini bisa 1-2 menit)..."
  npm install --silent
fi

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo ""
  echo "  ⚠ frontend-employee/.env dibuat. Edit VITE_SUPABASE_ANON_KEY"
  echo ""
  read -p "  Tekan ENTER setelah .env selesai diisi..."
fi

# Face models
if [[ ! -d "public/models" ]] || [[ -z "$(ls public/models 2>/dev/null)" ]]; then
  echo "  Downloading face-api.js models (~6MB)..."
  mkdir -p public/models
  bash "$ROOT_DIR/scripts/download_face_models.sh" "$(pwd)/public/models"
fi

# ---------- 4. Start backend in background ----------
echo ""
echo "▸ Starting backend at http://localhost:8000 ..."
cd "$ROOT_DIR/backend"
source venv/bin/activate

# Kill existing backend if running
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1

nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload \
  > logs.txt 2>&1 &

BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
sleep 3

# ---------- 5. Smoke test ----------
echo ""
echo "▸ Running smoke tests..."
echo ""

echo -n "  Test /health ... "
if curl -fsS http://localhost:8000/health > /dev/null; then
  echo "✓"
else
  echo "✗ Backend tidak respond. Cek backend/logs.txt"
  exit 1
fi

echo -n "  Test / (root) ... "
RESP=$(curl -fsS http://localhost:8000/)
if echo "$RESP" | grep -q "Labbaik HR API"; then
  echo "✓"
else
  echo "✗"
fi

echo -n "  Test /docs (Swagger UI) ... "
if curl -fsS http://localhost:8000/docs > /dev/null; then
  echo "✓"
else
  echo "✗"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✓ Setup complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Akses:"
echo "  • Backend API:     http://localhost:8000"
echo "  • API docs:        http://localhost:8000/docs"
echo "  • Health check:    http://localhost:8000/health"
echo ""
echo "Langkah berikutnya:"
echo "  cd frontend-employee && npm run dev"
echo "  → buka http://localhost:5173"
echo "  → login: ahmad.fauzi@bpkh.go.id / TesterLabbaik2026!"
echo ""
echo "Stop backend:"
echo "  pkill -f 'uvicorn app.main'"
echo ""
echo "Tail backend logs:"
echo "  tail -f backend/logs.txt"
echo ""
