#!/usr/bin/env bash
# ============================================================================
# ifNote — update / deploy script
#
# Pakai untuk pull versi terbaru + rebuild + restart, tanpa nge-touch
# Postgres / Nginx / SSL config.
#
# Jalankan sebagai user `ifnote` (atau root, script switch sendiri):
#
#   sudo -u ifnote bash /opt/ifnote/deploy/update.sh
#   # atau
#   sudo bash /opt/ifnote/deploy/update.sh
#
# ============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ifnote}"
APP_USER="${APP_USER:-ifnote}"

if [ "$(id -un)" != "$APP_USER" ]; then
  exec sudo -u "$APP_USER" -H bash "$0" "$@"
fi

cd "$APP_DIR"

echo "==> git pull"
git fetch --all --prune
git reset --hard origin/main

echo "==> backend: install + migrate + build"
cd "$APP_DIR/ifnote-api"
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy
npm run build

echo "==> frontend: install + build"
cd "$APP_DIR/ifnote-web"
npm install --no-audit --no-fund
npm run build

echo "==> pm2 reload"
cd "$APP_DIR"
pm2 startOrReload ecosystem.config.js
pm2 save

echo "==> health check"
sleep 3
if curl -fsS "http://127.0.0.1:3001/health" >/dev/null; then
  echo "    ✓ backend ok"
else
  echo "    ! backend belum respond — cek: pm2 logs ifnote-api"
fi
if curl -fsS "http://127.0.0.1:3000" >/dev/null; then
  echo "    ✓ frontend ok"
else
  echo "    ! frontend belum respond — cek: pm2 logs ifnote-web"
fi

echo "Selesai. Versi sekarang: $(git -C "$APP_DIR" rev-parse --short HEAD)"
