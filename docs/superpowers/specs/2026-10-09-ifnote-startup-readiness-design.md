# ifNote: kesiapan situs untuk aplikasi Claude Startups

Tanggal: 2026-10-09
Status: menunggu review pemilik (Imam Fanca Saputra)
Mode antislop: during (session override)

## Tujuan

Situs ifnote.app harus terlihat nyata, jujur, dan bisa dipakai siapa saja saat reviewer Claude Startups membukanya. Untuk itu: halaman About dan Kontak ada, halaman legal sudah live, landing dan halaman auth lolos antislop dan aksesibel, dan tidak ada kontrol atau klaim palsu.

Bukan tujuan: redesain total, reset password sungguhan, perbaikan DNS, deploy produksi.

## Fakta terverifikasi

| Fakta | Sumber |
|---|---|
| Pemilik dan kontak: Imam Fanca Saputra, `founder@ifnote.app` | pemilik, chat |
| Konten bawaan hanya N5 dan N4 | `ifnote-api/prisma/seed.ts` (tiga entri N4, nol N3 sampai N1) |
| Tidak ada kode pembayaran | grep `stripe\|midtrans\|xendit\|payment\|subscription\|billing` di `ifnote-api/src`: nol hasil |
| Produksi `/privacy` masih 404 | request ke `https://ifnote.app/privacy` |
| DNS: dua SPF, tiga DMARC | `Resolve-DnsName` ifnote.app (TXT dan `_dmarc`) |
| MX mengarah ke `mail.tiram.id` | `Resolve-DnsName` ifnote.app (MX) |

Belum terverifikasi: apakah mailbox `founder@` menerima email. Pemilik perlu mengirim email uji.

## Arah desain (R-37)

Token "Zen Ink" yang sudah ada di `ifnote-web/tailwind.config.js` adalah arahnya. Spec ini tidak menambah gaya baru.
Design Read: halaman produk edukasi untuk pelajar bahasa Jepang berbahasa Indonesia, bahasa visual kertas catatan dan tinta sumi, dial ENERGY 2 / RHYTHM 2 / MOTION 1.
Alasan dial: produk dipakai berulang untuk belajar, jadi gerak harus tenang. Variasi komposisi antar-seksi tetap ada.
`DESIGN.md` di root `ifnote-web` hanya mentranskrip token yang sudah ada (palet, font, radius, bayangan). Tidak ada isi karangan.

## Halaman baru

### `/about`
Kerangka `LegalPage` yang sudah ada. Isi (draf, disetujui pemilik sebelum rilis):

- Dibuat oleh Imam Fanca Saputra.
- Kenapa ifNote ada: satu paragraf dari sisi produk (catatan tersebar, ifNote menyatukannya). Tanpa latar belakang pribadi.
- Yang sudah ada: kotoba dan bunpou, hafalan 20 item per slide, quiz, AI tutor berbasis Claude, popup kanji dengan urutan goresan, ekspor dan impor cadangan.
- Yang belum ada: reset password otomatis, login Google atau GitHub, hapus akun mandiri, materi bawaan di atas N4.
- Kontak: `founder@ifnote.app`.

Kalimat "berbasis Claude" hanya ditampilkan jika produksi benar-benar memanggil model Claude (`AI_MODEL_ID` berisi model Claude), baik lewat `AI_REQUEST_FORMAT=anthropic` (Anthropic Messages API langsung) maupun lewat endpoint OpenAI-compatible yang meneruskan ke Claude. Backend mendukung kedua format dan pemilik memilihnya per deployment. Selama produksi belum memakai model Claude, kalimat itu tidak dirilis.

### `/contact`
- Alamat `founder@ifnote.app` sebagai tautan `mailto:` (R-26: perilaku nyata).
- Daftar keperluan: bug, permintaan hapus akun, pertanyaan soal data.
- Tidak ada janji waktu balasan (R-36).
- Tidak ada form. Form tanpa backend pengirim akan menjadi kontrol palsu.

### Tautan
Footer landing, `AuthCard`, dan pie `LegalPage` memuat Tentang, Kontak, Privasi, Ketentuan. `ROUTES` mendapat `about` dan `contact`. `.env.example` frontend menyebut `NEXT_PUBLIC_CONTACT_EMAIL=founder@ifnote.app`.

## Forgot password

`ForgotPasswordForm` (yang memakai `setTimeout` palsu) dihapus dari halaman. Halaman diganti penjelasan jujur: reset otomatis belum tersedia, kirim email dari alamat akun ke `founder@ifnote.app` dengan subjek terisi lewat `mailto:`. Reset sungguhan (token, SMTP) di luar lingkup, menunggu SPF dan DMARC bersih.

## Landing

| # | Perubahan | Aturan |
|---|---|---|
| L1 | Landing dirender server-side. Redirect user yang sudah login pindah ke komponen client kecil. Tidak ada spinner di HTML awal. | C-4 |
| L2 | Mock UI di kartu fitur diberi label "Contoh tampilan". | R-38 |
| L3 | Bento 4/2/2/4 diganti susunan yang mengikuti isi. Strip statistik dihapus. | R-05, R-14 |
| L4 | Klaim "N5–N1 semua level" diganti fakta: konten bawaan N5 dan N4, catatan buatan sendiri bisa diberi level N5 sampai N1. "Tanpa kartu kredit" diganti "Tidak ada pembayaran di app". "Gratis" dipertahankan jika pemilik konfirmasi. | R-36 |
| L5 | Link footer palsu (label berbeda, tujuan sama) dihapus. | R-24, R-26 |
| L6 | Em dash di semua copy landing diganti. | R-02 |
| L7 | Gerak tanpa henti (kana melayang, loop tulis kanji) dihapus. Animasi tulis kanji jalan sekali. | R-19, dial MOTION 1 |
| L8 | Panah di CTA dihapus kecuali ada alasan tertulis. Ikon `Bot` untuk AI diganti ikon yang relevan atau dihapus. | R-08, R-04 |

## Auth (login, register, forgot, AuthCard)

| # | Perubahan | Aturan |
|---|---|---|
| A1 | `maximumScale` dan `userScalable:false` dihapus dari `layout.tsx`. | antislop-human |
| A2 | Tombol lihat-password bisa difokus keyboard (`tabIndex` dihapus). | R-32 |
| A3 | Warna latar tombol primer digelapkan sampai teks putih ≥4.5:1. Cincin fokus ≥3:1 terhadap latarnya. Teks `ink-400` di permukaan gelap dinaikkan sampai ≥4.5:1 untuk teks kecil. Semua angka diverifikasi dengan `contrast-check.py`. | R-25, R-34 |
| A4 | Kesalahan submit login dan register tampil juga inline di form (`role="alert"`), selain toast. | R-27 |
| A5 | Emoji di toast auth dihapus. | antislop-ui |
| A6 | Em dash di `AuthCard` dan deskripsi forgot-password diganti. Kutipan produk di panel kiri tidak lagi bergaya testimoni. | R-02, R-18 |
| A7 | Loop animasi tanpa henti di panel kiri dihapus. | R-19 |
| A8 | Warna placeholder input dinaikkan kontrasnya. | R-25 |

## Tambahan setelah review pemilik

- **B1, deteksi format AI:** jika host Base URL adalah `api.anthropic.com`, format request otomatis menjadi `anthropic` meski field Request Format berisi `openai`. Host lain mengikuti pilihan pemilik. URL tidak valid tidak boleh melempar error.
- **Flag klaim Claude:** badge "AI Tutor ditenagai Claude" di landing dan kalimat "berbasis Claude" di About hanya tampil jika `NEXT_PUBLIC_POWERED_BY_CLAUDE=true`. Default mati. Pemilik menyalakannya setelah memastikan jalur produksi memakai Claude lewat Anthropic API resmi.
- **L9, hero:** titik dekoratif di atas judul dihapus (tidak menandai status apa pun). Deretan chip N5 sampai N1 diganti satu kalimat fakta: "Materi bawaan: N5 dan N4."
- **Kontak:** `CONTACT_EMAIL` berdefault `founder@ifnote.app` (fakta dari pemilik). Variabel env tetap bisa menimpanya.
- **Emoji toast (A5):** dibatasi pada toast di login dan register.
- **Langkah Catat, Hafal, Uji di landing** dipertahankan karena alur nyatanya memang tiga langkah (alasan tertulis, R-31).

## Di luar lingkup

- Perbaikan DNS (SPF, DMARC) di Cloudflare: dilakukan pemilik.
- Deploy ke ifnote.app: dilakukan pemilik. Tanpa deploy, `/privacy`, `/terms`, `/about`, `/contact` tetap 404 di produksi.
- Mengganti kunci proxy lokal di `.claude/settings.local.json`: dilakukan pemilik.
- Halaman di dalam `/app/*`: tidak diaudit di spec ini.

## Verifikasi (R-35)

1. `tsc --noEmit` dan `next build` bersih.
2. Server dev dijalankan, lalu klik-tembus setiap kontrol di `/`, `/login`, `/register`, `/forgot-password`, `/about`, `/contact`, `/privacy`, `/terms`. Termasuk viewport mobile (±375px), mode terang dan gelap, dan keyboard saja.
3. Konsol browser tanpa error.
4. Kontras setiap pasangan warna yang diubah diuji dengan `contrast-check.py`.
5. `impeccable detect` dijalankan ke URL dev yang live (viewport desktop dan 390x844) selain ke source.
6. Delivery Gate antislop dengan laporan PASS/FAIL dan bukti per baris.

## Risiko

- Backend butuh Postgres lokal dan kata sandinya belum diketahui, jadi halaman yang bergantung pada API (login sungguhan) mungkin tidak bisa diuji end-to-end. Halaman statis tetap bisa. Keterbatasan ini dilaporkan apa adanya.
- Mengubah warna primer berefek ke seluruh app, bukan hanya halaman audit. Perubahan dibatasi di token dan dicek pada layar `/app/*` yang memakai `Button` primer.
