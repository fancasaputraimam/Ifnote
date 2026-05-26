# Deploy ifNote ke VPS

Folder ini berisi script auto-install untuk pasang ifNote di VPS Ubuntu/Debian
fresh. Satu command, semua jalan.

## Yang akan ter-install

| Komponen | Versi | Kegunaan |
|---|---|---|
| Node.js | 20 LTS | Runtime backend & frontend |
| PostgreSQL | 16 | Database |
| Nginx | latest | Reverse proxy + gzip + SSL |
| PM2 | latest | Process manager + autostart |
| Certbot | (opsional) | Let's Encrypt SSL kalau DOMAIN di-set |

## Yang akan ter-setup

1. User `ifnote` (system user, no shell)
2. App dir di `/opt/ifnote` dengan source dari GitHub
3. Database `ifnote` + user `ifnote` (password random)
4. Backend NestJS di port 3001 (lokal)
5. Frontend Next.js di port 3000 (lokal)
6. Nginx terima publik:
   - Port 80 (atau 443 dengan SSL)
   - `/api/*` → backend
   - `/*` → frontend
7. UFW firewall: allow OpenSSH + 80 + 443

## Prerequisites

- VPS Ubuntu 22.04 atau Debian 12 (fresh, akses root via SSH)
- 1 vCPU, 1 GB RAM minimum (2 GB recommended)
- 10 GB disk
- (Opsional) Domain pointing ke IP VPS untuk SSL

## Cara pakai

### Mode 1: One-liner (recommended)

```bash
ssh root@your-vps-ip

# Set environment dulu (private repo butuh GITHUB_TOKEN)
export GITHUB_TOKEN=ghp_xxx                  # personal access token dengan scope `repo`
export DOMAIN=ifnote.example.com             # opsional, untuk SSL
export EMAIL=admin@example.com               # untuk Let's Encrypt notif
export AI_API_KEY=sk-...                     # opsional, AI proxy
export AI_BASE_URL=https://api.openai.com/v1
export AI_MODEL_ID=gpt-4o-mini

curl -fsSL https://raw.githubusercontent.com/IfNetworks21/ifnote/main/deploy/install.sh | bash
```

> Karena repo private, raw URL juga butuh token. Workaround:
> ```bash
> curl -fsSL -H "Authorization: token $GITHUB_TOKEN" \
>   https://raw.githubusercontent.com/IfNetworks21/ifnote/main/deploy/install.sh | bash
> ```

### Mode 2: Clone manual lalu run

```bash
ssh root@your-vps-ip
git clone https://YOUR_TOKEN@github.com/IfNetworks21/ifnote.git /tmp/ifnote-bootstrap
cd /tmp/ifnote-bootstrap
sudo -E bash deploy/install.sh
```

Setelah selesai, `/tmp/ifnote-bootstrap` boleh dihapus — script sudah clone
ulang ke `/opt/ifnote`.

## Environment variables

| Variable | Required | Default | Catatan |
|---|---|---|---|
| `GITHUB_TOKEN` | ✅ (private repo) | — | PAT scope `repo`. Token di-strip dari git remote setelah clone. |
| `DOMAIN` | ❌ | — | Tanpa domain → app diakses via IP via HTTP. |
| `EMAIL` | ❌ | `admin@$DOMAIN` | Buat Let's Encrypt agreement. |
| `AI_API_KEY` | ❌ | (kosong) | AI proxy fallback ke mock kalau kosong. |
| `AI_BASE_URL` | ❌ | `https://api.openai.com/v1` | Provider OpenAI-compatible. |
| `AI_MODEL_ID` | ❌ | `gpt-4o-mini` | |
| `JWT_SECRET` | ❌ | auto-generate | 96-char hex. |
| `DB_PASS` | ❌ | auto-generate | 48-char hex. |
| `APP_DIR` | ❌ | `/opt/ifnote` | |
| `APP_USER` | ❌ | `ifnote` | |
| `BACKEND_PORT` | ❌ | `3001` | Internal port backend. |
| `FRONTEND_PORT` | ❌ | `3000` | Internal port frontend. |
| `NODE_MAJOR` | ❌ | `20` | |

## Setelah install

```bash
# Cek status PM2
sudo -u ifnote pm2 status

# Lihat logs
sudo -u ifnote pm2 logs ifnote-api --lines 100
sudo -u ifnote pm2 logs ifnote-web --lines 100

# Restart
sudo -u ifnote pm2 restart all

# Cek nginx
sudo nginx -t
sudo systemctl status nginx

# Cek backend langsung
curl http://127.0.0.1:3001/health
```

## Update ke versi baru

Setiap kali kamu push commit baru ke `main`:

```bash
ssh root@your-vps-ip
sudo bash /opt/ifnote/deploy/update.sh
```

Script akan: `git pull` → reinstall deps → migrate prisma → build → reload PM2.

## Setup SSL nanti (kalau awalnya pakai IP)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ifnote.example.com
```

Setelah SSL active, update `FRONTEND_URL` di `.env` backend + `NEXT_PUBLIC_API_BASE_URL` di `.env.local` frontend ke `https://...`, lalu rebuild:

```bash
sudo -u ifnote bash /opt/ifnote/deploy/update.sh
```

## Uninstall

```bash
sudo bash /opt/ifnote/deploy/uninstall.sh
# atau pertahankan database:
sudo bash /opt/ifnote/deploy/uninstall.sh --keep-db
```

Yang dihapus: app dir, app user, pm2 services, nginx config, db (kecuali `--keep-db`).
Yang **tidak** dihapus: Node / PostgreSQL / Nginx daemon (mungkin masih dipakai app lain).

## Troubleshooting

### Backend tidak respond setelah install

```bash
sudo -u ifnote pm2 logs ifnote-api --lines 200 --nostream
# Biasanya: DATABASE_URL salah, atau migrate gagal
```

Manual run migrate:
```bash
cd /opt/ifnote/ifnote-api
sudo -u ifnote npx prisma migrate deploy
```

### Frontend stuck di build

Out of memory di VPS 1 GB. Tambah swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo bash /opt/ifnote/deploy/update.sh
```

### Nginx 502 Bad Gateway

Backend / frontend belum jalan. Restart PM2:
```bash
sudo -u ifnote pm2 restart all
sudo -u ifnote pm2 status
```

### Port 80 sudah dipakai

```bash
sudo lsof -i :80
# Stop service yang konflik (Apache, dll)
sudo systemctl stop apache2 && sudo systemctl disable apache2
sudo systemctl reload nginx
```

### Lupa generated DB password

```bash
sudo cat /opt/ifnote/ifnote-api/.env | grep DATABASE_URL
```

### Test koneksi DB manual

```bash
sudo -u postgres psql -d ifnote -c "\dt"
```

## Security default

- App user `ifnote` adalah system user tanpa login shell (no SSH login)
- `.env` di-chmod 600, hanya readable user `ifnote`
- Password DB + JWT secret auto-generate, tidak di-print di log
- Nginx terima request hanya di port 80/443; backend & frontend bind ke 127.0.0.1
- UFW block semua port lain
- AI key (kalau di-set) hanya di backend `.env`, tidak pernah expose ke frontend
- HTTPS otomatis via certbot kalau DOMAIN di-set, dengan auto-renew via systemd timer
