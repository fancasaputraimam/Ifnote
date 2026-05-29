# SECURITY_DEPLOY.md

Checklist keamanan untuk deploy ifNote Web ke VPS / lingkungan production.
Dokumen ini adalah pendamping `DEPLOY_VPS.md` dan `DATABASE_OPTIONS.md` —
fokus di bagian yang tidak boleh terlewat dari sisi *security operations*.

---

## 1. SSH dan akses VPS

- Login pakai SSH key, bukan password.
  ```bash
  # di mesin lokal
  ssh-keygen -t ed25519 -C "ifnote-deploy"
  ssh-copy-id user@your-vps
  ```
- Setelah verifikasi key bisa login, matikan login password root:
  ```
  /etc/ssh/sshd_config:
    PermitRootLogin prohibit-password
    PasswordAuthentication no
  ```
  ```bash
  sudo systemctl reload ssh
  ```
- Buat user non-root dengan sudo terbatas. Hindari deploy sebagai `root`.

## 2. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP (akan redirect ke HTTPS)
sudo ufw allow 443/tcp       # HTTPS
# JANGAN expose port database / app server langsung ke internet:
# - PostgreSQL 5432  -> hanya localhost
# - ifnote-api 3003  -> reverse-proxy via Nginx
sudo ufw enable
sudo ufw status verbose
```

## 3. PostgreSQL

- Bind ke localhost saja, bukan 0.0.0.0:
  ```
  /etc/postgresql/<ver>/main/postgresql.conf:
    listen_addresses = 'localhost'
  ```
- Pastikan `pg_hba.conf` hanya menerima `127.0.0.1/32` dengan auth
  `scram-sha-256` (jangan `trust`).
- DB user untuk app **bukan superuser**. Buat user khusus:
  ```sql
  CREATE USER ifnote_app WITH PASSWORD '...';
  CREATE DATABASE ifnote OWNER ifnote_app;
  GRANT CONNECT ON DATABASE ifnote TO ifnote_app;
  ```
- Untuk database eksternal (Neon / Supabase / Railway / RDS / Cloud SQL):
  - Wajib pakai SSL (`?sslmode=require`).
  - Rotasi credential berkala.
  - Lihat `DATABASE_OPTIONS.md` untuk panduan provider.

## 4. Backup

- Cron `pg_dump` harian, simpan minimal 7 generasi:
  ```bash
  0 3 * * *  pg_dump -Fc -U ifnote_app -h 127.0.0.1 ifnote \
    > /var/backups/ifnote/$(date +\%F).pgc
  find /var/backups/ifnote -mtime +7 -delete
  ```
- Test restore minimal 1x sebulan ke staging.
- Backup harus dienkripsi at rest (mis. di S3 dengan SSE-S3/KMS), tidak
  boleh public.

## 5. HTTPS / TLS

- Pakai Let's Encrypt via certbot:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com
  ```
- Force redirect HTTP -> HTTPS di Nginx.
- HSTS minimal 6 bulan setelah dikonfirmasi seluruh subdomain HTTPS:
  ```
  add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;
  ```

## 6. Nginx security headers

Tambahkan ke server block production:

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;
# CSP minimum (sesuaikan kalau frontend pakai inline script):
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://your-api-domain.com" always;
```

Backend (NestJS) sudah pakai `helmet()` di `main.ts`, jadi header
ekstra di Nginx adalah lapisan kedua yang aman ditumpuk.

## 7. Environment variables

- Wajib ada di production:
  - `DATABASE_URL` — pakai SSL kalau eksternal
  - `JWT_SECRET` — minimal 32 char acak (`openssl rand -hex 32`)
  - `FRONTEND_URL` — domain frontend untuk CORS
  - `OWNER_EMAIL` — opsional, default ke konstanta di code
  - `AI_API_KEY` — opsional, hanya kalau owner mau key di-share
- File `.env`, `.env.local`, `.env.production` sudah ada di
  `.gitignore`. **Jangan commit secret apapun.**
- Audit ulang riwayat git kalau khawatir secret pernah ke-commit:
  ```bash
  git log --all -p -S "AI_API_KEY" -- .env .env.local 2>/dev/null
  ```

## 8. CORS dan FRONTEND_URL

- Backend `main.ts` enable CORS via `env.frontendUrl`. Jangan pakai `*`.
- Production:
  ```
  FRONTEND_URL=https://your-domain.com
  ```
- Development (local):
  ```
  FRONTEND_URL=http://localhost:3002
  ```
- Kalau punya beberapa origin (mis. staging + prod), refactor jadi
  array di `loadEnv()` dan check membership.

## 9. Rate limiting

Setelah hardening sekarang:

- `POST /api/auth/login`     : 5 attempt / 15 menit per IP
- `POST /api/auth/register`  : 5 attempt / 1 jam per IP
- AI endpoints              : tidak ada limit khusus (di-cover global default 60/min)
- Default global            : 60 request / menit per IP (lapisan paling kasar)

Limiter saat ini in-memory (`@nestjs/throttler` default). Kalau scale
ke multi-instance, ganti backend ke Redis (lihat
`@nestjs/throttler` storage adapter).

## 10. Logging

- **Jangan** pernah log:
  - password
  - JWT token (raw)
  - refresh token
  - API key (mentah maupun dengan prefix)
  - `DATABASE_URL` lengkap
- Audit kode pakai grep cepat:
  ```bash
  grep -rni "console.log" ifnote-api/src | grep -E "password|token|api[_-]?key|secret"
  ```
- Production logger (NestJS) sudah di-set ke level `log/warn/error`
  saja di `main.ts`.

## 11. PM2 / process manager

- Restart on file change **off** di production.
- Log rotation aktif:
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 14
  ```
- Pastikan service auto-start saat boot:
  ```bash
  pm2 startup
  pm2 save
  ```

## 12. Update rutin

- Sistem: `sudo apt update && sudo apt upgrade` minimal 1x sebulan.
- Node deps: `npm audit` per release.
- Prisma & framework major upgrade: test dulu di staging.

## 13. Account / kebijakan owner

- Owner email default ada di
  `ifnote-api/src/common/auth/owner.ts`. Bisa override via env
  `OWNER_EMAIL`.
- AI configuration **hanya owner** yang bisa lihat / edit. Backend
  punya `OwnerGuard` (`common/auth/owner.guard.ts`) sebagai sumber
  kebenaran — frontend hanya menyembunyikan UI sebagai UX.
- Password user minimal 8 karakter (hash bcrypt 10 rounds).
- Idle frontend: 14 menit warning, 15 menit auto-logout (lihat
  `IdleLogoutWatcher.tsx`).

---

## Checklist quick verify

- [ ] SSH key login, password disabled
- [ ] UFW enabled, hanya 22/80/443
- [ ] PostgreSQL bind 127.0.0.1, app user non-superuser
- [ ] HTTPS aktif, redirect HTTP -> HTTPS
- [ ] HSTS + security headers di Nginx
- [ ] `.env*` di-ignore git, JWT_SECRET >= 32 char
- [ ] FRONTEND_URL = domain real (bukan `*`)
- [ ] Backup harian + restore test bulanan
- [ ] PM2 logrotate aktif
- [ ] Tidak ada secret di code / log

---

Setiap kali deploy major change, jalankan ulang checklist ini.
