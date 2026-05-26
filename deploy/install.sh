#!/usr/bin/env bash
# ============================================================================
# ifNote — auto installer untuk VPS Ubuntu / Debian
#
# Yang di-install:
#   - Node.js 20 LTS
#   - PostgreSQL 16
#   - Nginx (reverse proxy + static cache)
#   - PM2 (process manager)
#   - Certbot (opsional, kalau DOMAIN di-set)
#
# Yang di-setup:
#   - DB ifnote + user dengan password random
#   - Backend NestJS di port 3001 (lokal)
#   - Frontend Next.js di port 3000 (lokal)
#   - Nginx terima request publik di port 80 (atau 443 dengan SSL)
#       /api/*  → backend
#       /*      → frontend
#
# Cara pakai:
#
#   1. SSH ke VPS Ubuntu/Debian fresh sebagai root.
#
#   2. Jalankan installer (private repo butuh GITHUB_TOKEN):
#
#        export GITHUB_TOKEN=ghp_xxx
#        export DOMAIN=ifnote.example.com         # opsional, untuk SSL
#        export EMAIL=admin@example.com           # untuk Let's Encrypt
#        export AI_API_KEY=sk-...                 # opsional
#        export AI_BASE_URL=https://api.openai.com/v1
#        export AI_MODEL_ID=gpt-4o-mini
#        curl -fsSL https://raw.githubusercontent.com/IfNetworks21/ifnote/main/deploy/install.sh | bash
#
#      Atau clone manual lalu run lokal:
#        git clone https://github.com/IfNetworks21/ifnote.git
#        cd ifnote
#        sudo -E bash deploy/install.sh
#
# Re-run aman (idempotent) — script ini bisa dijalankan ulang untuk update.
# ============================================================================

set -euo pipefail

# ---- Config (override via env vars) ----------------------------------------
REPO_URL="${REPO_URL:-https://github.com/IfNetworks21/ifnote.git}"
APP_DIR="${APP_DIR:-/opt/ifnote}"
APP_USER="${APP_USER:-ifnote}"
DB_NAME="${DB_NAME:-ifnote}"
DB_USER="${DB_USER:-ifnote}"
DB_PASS="${DB_PASS:-}"          # auto-generate if empty
JWT_SECRET="${JWT_SECRET:-}"    # auto-generate if empty
DOMAIN="${DOMAIN:-}"            # if empty: serve over plain HTTP via IP
EMAIL="${EMAIL:-}"              # required by certbot if DOMAIN set
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
AI_API_KEY="${AI_API_KEY:-}"
AI_BASE_URL="${AI_BASE_URL:-https://api.openai.com/v1}"
AI_MODEL_ID="${AI_MODEL_ID:-gpt-4o-mini}"
NODE_MAJOR="${NODE_MAJOR:-20}"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# ---- Colors ----------------------------------------------------------------
if [ -t 1 ]; then
  C_GREEN="\e[32m"; C_YELLOW="\e[33m"; C_RED="\e[31m"; C_BOLD="\e[1m"; C_RESET="\e[0m"
else
  C_GREEN=""; C_YELLOW=""; C_RED=""; C_BOLD=""; C_RESET=""
fi
log()  { echo -e "${C_GREEN}==>${C_RESET} ${C_BOLD}$*${C_RESET}"; }
warn() { echo -e "${C_YELLOW}!! $*${C_RESET}"; }
fail() { echo -e "${C_RED}xx $*${C_RESET}" >&2; exit 1; }

# ---- Pre-flight ------------------------------------------------------------
[ "$(id -u)" -eq 0 ] || fail "Jalankan sebagai root (sudo bash deploy/install.sh)"

if ! grep -qiE "ubuntu|debian" /etc/os-release; then
  fail "Hanya support Ubuntu/Debian. Distro lain belum di-test."
fi

if [ -z "$DB_PASS" ]; then
  DB_PASS=$(openssl rand -hex 24)
fi
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 48)
fi

PUBLIC_URL="http://$(hostname -I | awk '{print $1}')"
if [ -n "$DOMAIN" ]; then
  PUBLIC_URL="https://$DOMAIN"
fi

log "ifNote installer mulai"
echo "    REPO       : $REPO_URL"
echo "    APP_DIR    : $APP_DIR"
echo "    APP_USER   : $APP_USER"
echo "    DB         : $DB_NAME (user: $DB_USER)"
echo "    DOMAIN     : ${DOMAIN:-<pakai IP>}"
echo "    PUBLIC_URL : $PUBLIC_URL"
echo

# ---- 1. apt deps -----------------------------------------------------------
log "Update apt + install dependencies"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg git build-essential \
  postgresql postgresql-contrib \
  nginx ufw

# ---- 2. Node.js 20 ---------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt "$NODE_MAJOR" ]; then
  log "Install Node.js $NODE_MAJOR LTS"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
else
  log "Node.js sudah ada: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Install PM2"
  npm install -g pm2@latest --silent
else
  log "PM2 sudah ada: $(pm2 -v)"
fi

# ---- 3. App user -----------------------------------------------------------
if ! id "$APP_USER" >/dev/null 2>&1; then
  log "Buat user $APP_USER"
  useradd --system --create-home --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"
fi

# ---- 4. Clone / pull repo --------------------------------------------------
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
  log "Repo sudah ada, pull update"
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --all --prune
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main
else
  log "Clone repo $REPO_URL"
  CLONE_URL="$REPO_URL"
  if [ -n "$GITHUB_TOKEN" ] && [[ "$REPO_URL" == https://github.com/* ]]; then
    CLONE_URL="https://${GITHUB_TOKEN}@${REPO_URL#https://}"
  fi
  sudo -u "$APP_USER" git clone "$CLONE_URL" "$APP_DIR"
  # Strip token from remote
  sudo -u "$APP_USER" git -C "$APP_DIR" remote set-url origin "$REPO_URL"
fi

# ---- 5. Postgres setup -----------------------------------------------------
log "Setup Postgres database"
systemctl enable --now postgresql

# Idempotent: only create role/db if missing
ROLE_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" || true)
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" || true)

if [ "$ROLE_EXISTS" != "1" ]; then
  sudo -u postgres psql -c "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$DB_PASS';"
else
  sudo -u postgres psql -c "ALTER ROLE \"$DB_USER\" WITH PASSWORD '$DB_PASS';"
fi

if [ "$DB_EXISTS" != "1" ]; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public"

# ---- 6. Backend env + install + migrate + build ----------------------------
log "Setup backend (ifnote-api)"
cat > "$APP_DIR/ifnote-api/.env" <<EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
AI_API_KEY=$AI_API_KEY
AI_BASE_URL=$AI_BASE_URL
AI_MODEL_ID=$AI_MODEL_ID
AI_REQUEST_FORMAT=openai
FRONTEND_URL=$PUBLIC_URL
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/ifnote-api/.env"
chmod 600 "$APP_DIR/ifnote-api/.env"

sudo -u "$APP_USER" bash -lc "
  set -e
  cd $APP_DIR/ifnote-api
  npm install --omit=dev=false --no-audit --no-fund
  npx prisma generate
  npx prisma migrate deploy
  npm run build
"

# ---- 7. Frontend env + install + build -------------------------------------
log "Setup frontend (ifnote-web)"
cat > "$APP_DIR/ifnote-web/.env.local" <<EOF
NEXT_PUBLIC_API_BASE_URL=$PUBLIC_URL
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/ifnote-web/.env.local"
chmod 600 "$APP_DIR/ifnote-web/.env.local"

sudo -u "$APP_USER" bash -lc "
  set -e
  cd $APP_DIR/ifnote-web
  npm install --no-audit --no-fund
  npm run build
"

# ---- 8. PM2 ecosystem ------------------------------------------------------
log "Setup PM2 services"
cat > "$APP_DIR/ecosystem.config.js" <<EOF
module.exports = {
  apps: [
    {
      name: "ifnote-api",
      cwd: "$APP_DIR/ifnote-api",
      script: "node",
      args: "dist/src/main.js",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      out_file: "/var/log/ifnote/api.out.log",
      error_file: "/var/log/ifnote/api.err.log",
      time: true,
    },
    {
      name: "ifnote-web",
      cwd: "$APP_DIR/ifnote-web",
      script: "npm",
      args: "run start -- -p $FRONTEND_PORT",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      out_file: "/var/log/ifnote/web.out.log",
      error_file: "/var/log/ifnote/web.err.log",
      time: true,
    },
  ],
};
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

mkdir -p /var/log/ifnote
chown -R "$APP_USER:$APP_USER" /var/log/ifnote

sudo -u "$APP_USER" bash -lc "cd $APP_DIR && pm2 startOrReload ecosystem.config.js && pm2 save"
# Install PM2 startup hook (only first time will create new systemd unit)
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null 2>&1 || true
systemctl daemon-reload || true
systemctl enable "pm2-$APP_USER" 2>/dev/null || true

# ---- 9. Nginx --------------------------------------------------------------
log "Setup Nginx"
NGINX_CONF=/etc/nginx/sites-available/ifnote
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN:-_};

    client_max_body_size 5m;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;

    # Backend (NestJS) — /api/* and /health
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
    location = /health {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/health;
    }

    # Frontend (Next.js) — everything else
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ifnote
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# ---- 10. UFW firewall ------------------------------------------------------
log "Konfigurasi UFW (allow OpenSSH + HTTP + HTTPS)"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
yes | ufw enable >/dev/null 2>&1 || true

# ---- 11. SSL via certbot (kalau DOMAIN di-set) -----------------------------
if [ -n "$DOMAIN" ]; then
  log "Setup SSL untuk $DOMAIN via Let's Encrypt"
  apt-get install -y certbot python3-certbot-nginx
  if [ -z "$EMAIL" ]; then
    EMAIL="admin@$DOMAIN"
    warn "EMAIL tidak di-set, pakai $EMAIL"
  fi
  certbot --nginx --non-interactive --agree-tos --redirect \
    --email "$EMAIL" --domain "$DOMAIN" || warn "certbot gagal — kamu bisa rerun manual nanti."
fi

# ---- 12. Health check ------------------------------------------------------
log "Health check"
sleep 5
if curl -fsS "http://127.0.0.1:$BACKEND_PORT/health" >/dev/null; then
  echo "  ✓ backend respond di /health"
else
  warn "backend belum respond — cek: pm2 logs ifnote-api"
fi
if curl -fsS "http://127.0.0.1:$FRONTEND_PORT" >/dev/null; then
  echo "  ✓ frontend respond"
else
  warn "frontend belum respond — cek: pm2 logs ifnote-web"
fi
if curl -fsS "$PUBLIC_URL/health" >/dev/null 2>&1; then
  echo "  ✓ public URL: $PUBLIC_URL"
else
  echo "  i public URL: $PUBLIC_URL  (cek lagi setelah DNS / SSL ready)"
fi

# ---- Summary ---------------------------------------------------------------
log "Selesai 🎉"
cat <<EOF

=================================================================
ifNote terpasang di VPS

  URL publik     : $PUBLIC_URL
  Backend (lokal): 127.0.0.1:$BACKEND_PORT
  Frontend (lokal): 127.0.0.1:$FRONTEND_PORT
  App dir        : $APP_DIR
  App user       : $APP_USER
  Database       : $DB_NAME (user: $DB_USER)

  Connection string disimpan di:
    $APP_DIR/ifnote-api/.env

  Berguna sekali-sekali:
    pm2 status
    pm2 logs ifnote-api --lines 100
    pm2 logs ifnote-web --lines 100
    pm2 restart all
    sudo -u $APP_USER bash $APP_DIR/deploy/update.sh

=================================================================
EOF
