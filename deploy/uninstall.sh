#!/usr/bin/env bash
# ============================================================================
# ifNote — uninstall script
#
# Hapus semua: app dir, user, db, pm2 services, nginx config.
# Tidak hapus Node / PostgreSQL / Nginx daemon — tools itu mungkin dipakai
# app lain.
#
# Jalankan sebagai root:
#   sudo bash /opt/ifnote/deploy/uninstall.sh
#
# Tambah --keep-db kalau cuma mau remove app tapi pertahankan database.
# ============================================================================

set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Jalankan sebagai root."; exit 1; }

APP_DIR="${APP_DIR:-/opt/ifnote}"
APP_USER="${APP_USER:-ifnote}"
DB_NAME="${DB_NAME:-ifnote}"
DB_USER="${DB_USER:-ifnote}"
KEEP_DB=0

for arg in "$@"; do
  case "$arg" in
    --keep-db) KEEP_DB=1 ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

read -r -p "Yakin uninstall ifNote? Ini hapus app + pm2. [y/N] " confirm
[[ "${confirm:-}" =~ ^[Yy]$ ]] || { echo "Batal."; exit 0; }

echo "==> Stop pm2 + delete services"
sudo -u "$APP_USER" -H pm2 delete all 2>/dev/null || true
systemctl disable "pm2-$APP_USER" 2>/dev/null || true
systemctl stop "pm2-$APP_USER" 2>/dev/null || true
rm -f "/etc/systemd/system/pm2-$APP_USER.service"
systemctl daemon-reload || true

echo "==> Remove nginx config"
rm -f /etc/nginx/sites-enabled/ifnote /etc/nginx/sites-available/ifnote
nginx -t && systemctl reload nginx || true

echo "==> Remove app dir"
rm -rf "$APP_DIR"
rm -rf /var/log/ifnote

echo "==> Remove app user"
userdel -r "$APP_USER" 2>/dev/null || true

if [ "$KEEP_DB" -ne 1 ]; then
  echo "==> Drop database + role"
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" || true
  sudo -u postgres psql -c "DROP ROLE IF EXISTS \"$DB_USER\";" || true
else
  echo "==> KEEP_DB=1: db + role tidak dihapus."
fi

echo "Uninstall selesai."
