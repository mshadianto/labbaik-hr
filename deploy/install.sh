#!/usr/bin/env bash
# =============================================================
# Labbaik HR · VPS Deployment Script
# Target: Ubuntu 22.04+ on SumoPod (43.128.106.71)
#
# Usage (as root or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/mshadianto/labbaik-hr/main/deploy/install.sh | sudo bash
# Or clone & run:
#   sudo bash deploy/install.sh
# =============================================================

set -euo pipefail

APP_DIR="/opt/labbaik-hr"
APP_USER="labbaik"
NODE_VERSION="20"
PY_VERSION="python3.11"

echo "════════════════════════════════════════════════════════"
echo "  Labbaik HR · Installation Script"
echo "════════════════════════════════════════════════════════"
echo ""

# ---------- 1. Check root ----------
if [[ $EUID -ne 0 ]]; then
   echo "✗ Harus dijalankan sebagai root (sudo)"
   exit 1
fi

# ---------- 2. System packages ----------
echo "▸ Installing system packages..."
apt update -qq
apt install -y -qq \
    ${PY_VERSION} ${PY_VERSION}-venv ${PY_VERSION}-dev \
    python3-pip git curl wget build-essential \
    nginx certbot python3-certbot-nginx \
    postgresql-client ufw fail2ban

# Node.js
if ! command -v node &> /dev/null; then
    echo "▸ Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y -qq nodejs
fi

# ---------- 3. Create app user ----------
if ! id "$APP_USER" &>/dev/null; then
    echo "▸ Creating user '$APP_USER'..."
    useradd -m -s /bin/bash "$APP_USER"
fi

# ---------- 4. Clone / pull repo ----------
if [[ -d "$APP_DIR/.git" ]]; then
    echo "▸ Updating existing repo..."
    cd "$APP_DIR"
    sudo -u $APP_USER git pull
else
    echo "▸ Cloning repo..."
    rm -rf "$APP_DIR"
    sudo -u $APP_USER git clone https://github.com/mshadianto/labbaik-hr.git "$APP_DIR"
fi

mkdir -p "$APP_DIR/backend/logs"
chown -R $APP_USER:$APP_USER "$APP_DIR"

# ---------- 5. Backend setup ----------
echo "▸ Setting up backend..."
cd "$APP_DIR/backend"
sudo -u $APP_USER $PY_VERSION -m venv venv
sudo -u $APP_USER ./venv/bin/pip install --upgrade pip -q
sudo -u $APP_USER ./venv/bin/pip install -r requirements.txt -q

if [[ ! -f "$APP_DIR/backend/.env" ]]; then
    echo "⚠ Creating .env from template. EDIT sebelum start service!"
    cp .env.example .env
    chown $APP_USER:$APP_USER .env
    chmod 600 .env
fi

# ---------- 6. Frontend builds ----------
echo "▸ Building employee frontend..."
cd "$APP_DIR/frontend-employee"
sudo -u $APP_USER npm install --silent
# Download face-api.js models if missing
if [[ ! -d "public/models" ]] || [[ -z "$(ls -A public/models 2>/dev/null)" ]]; then
    echo "  Downloading face-api.js models..."
    sudo -u $APP_USER bash ../scripts/download_face_models.sh
fi
if [[ -f ".env" ]]; then
    sudo -u $APP_USER npm run build --silent
    mkdir -p /var/www/labbaik.bpkh.go.id
    cp -r dist/* /var/www/labbaik.bpkh.go.id/
else
    echo "⚠ Frontend .env missing, skipping build. Copy from .env.example."
fi

echo "▸ Building admin frontend..."
cd "$APP_DIR/frontend-admin"
sudo -u $APP_USER npm install --silent
if [[ -f ".env" ]]; then
    sudo -u $APP_USER npm run build --silent
    mkdir -p /var/www/admin.labbaik.bpkh.go.id
    cp -r dist/* /var/www/admin.labbaik.bpkh.go.id/
fi

# ---------- 7. Nginx configs ----------
echo "▸ Installing Nginx configs..."
cp $APP_DIR/deploy/nginx/*.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/labbaik.bpkh.go.id.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.labbaik.bpkh.go.id.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.labbaik.bpkh.go.id.conf /etc/nginx/sites-enabled/
nginx -t

# ---------- 8. systemd ----------
echo "▸ Installing systemd service..."
cp $APP_DIR/deploy/systemd/labbaik-hr-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable labbaik-hr-api

# ---------- 9. Firewall ----------
echo "▸ Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✓ Installation complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Langkah berikutnya:"
echo "  1. Edit backend env:   sudo -u labbaik nano $APP_DIR/backend/.env"
echo "  2. Edit frontend env:  sudo -u labbaik nano $APP_DIR/frontend-employee/.env"
echo "     (lalu rebuild:      cd $APP_DIR/frontend-employee && npm run build)"
echo "  3. Arahkan DNS:"
echo "       labbaik.bpkh.go.id       → $(curl -s ifconfig.me)"
echo "       admin.labbaik.bpkh.go.id → $(curl -s ifconfig.me)"
echo "       api.labbaik.bpkh.go.id   → $(curl -s ifconfig.me)"
echo "  4. SSL certs (setelah DNS propagate):"
echo "       certbot --nginx -d labbaik.bpkh.go.id -d admin.labbaik.bpkh.go.id -d api.labbaik.bpkh.go.id"
echo "  5. Start backend:      systemctl start labbaik-hr-api"
echo "  6. Reload nginx:       systemctl reload nginx"
echo "  7. Check logs:         journalctl -u labbaik-hr-api -f"
echo ""
