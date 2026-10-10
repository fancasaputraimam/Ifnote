# ifNote Design (Zen Ink)

Transkripsi dari `tailwind.config.js` dan `src/styles/globals.css`. Tidak ada arah gaya baru di dokumen ini.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

Design Read: halaman produk edukasi untuk pelajar bahasa Jepang berbahasa Indonesia, bahasa visual kertas catatan dan tinta sumi.

## Identitas

Kertas putih bersih, teks tinta sumi, satu aksen merah vermillion (shu-iro, merah stempel hanko). Indigo dan hijau matcha sebagai warna sekunder yang tenang. Motif yang berulang: garis margin merah buku latihan, kertas bergaris (`.notebook-rule`), ensō, teks vertikal Jepang, stempel hanko.

## Palet

| Token | Nilai | Peran |
|---|---|---|
| `paper-50` | `#fdfdfc` | latar aplikasi (terang) |
| `paper-100` | `#f6f5f2` | isi terangkat / hover |
| `paper-200` | `#e8e6e1` | garis tipis |
| `paper-300` | `#d5d2ca` | garis kuat / pemisah |
| `paper-400` | `#aaa69c` | |
| `paper-800` | `#161514` | malam (legacy) |
| `paper-900` | `#0f0e0d` | latar aplikasi (gelap) |
| `ink-50` | `#f7f7f6` | teks di latar gelap |
| `ink-300` | `#a5a5a1` | teks redup di mode gelap (via aturan `.dark .text-ink-400`) |
| `ink-400` | `#6e6e69` | teks redup (terang) |
| `ink-700` | `#262624` | garis mode gelap |
| `ink-800` | `#1a1a18` | permukaan / kartu mode gelap, teks utama terang |
| `accent-500` | `#d94f33` | aksen utama |
| `accent-600` | `#ba3c23` | cincin fokus (terang), teks aksen |
| `accent-700` | `#97311e` | teks aksen di atas putih |
| `accent-300` | `#f0a08c` | cincin fokus dan teks aksen (gelap) |
| `lilac-600` | `#3e5f76` | indigo (ai-iro), sekunder |
| `leaf-600` | `#57723c` | hijau matcha, sukses |

Skala lengkap ada di `tailwind.config.js` (`paper`, `ink`, `accent`, `lilac`, `leaf`). Nama token `lilac` dan `leaf` dipertahankan meski warnanya indigo dan matcha.

Gradien aksen (`accent-gradient`): `#c9462c` ke `#c0402a` ke `#ad351f`, sudut 135 derajat. Setiap titik lolos 4.5:1 dengan teks putih (4.78, 5.24, 6.35).

## Tipografi

- Sans: Zen Kaku Gothic New (`--font-sans`), cadangan sistem.
- Serif (judul): Zen Old Mincho (`--font-serif`).
- Jepang: `font-jp` (Zen Kaku Gothic New, Noto Sans JP), `word-break: keep-all`, line-height 1.9.
- Furigana: `ruby rt` 0.58 sampai 0.62em.

## Bentuk dan kedalaman

- Radius: `notebook-sm` 0.625rem, `notebook` 1rem, `notebook-lg` 1.5rem. Tombol berbentuk pil.
- Bayangan: `notebook`, `notebook-md`, `notebook-lg` (tinta, tipis). `glow` dan `glow-sm` hanya untuk aksen tombol utama.

## Gerak

MOTION 1: hover dan transisi pendek. Animasi masuk satu kali untuk halaman auth. Animasi tulis kanji di landing berjalan sekali dan bisa diputar ulang oleh pengguna. Tidak ada animasi berulang tanpa henti di landing dan auth. `prefers-reduced-motion` dihormati.

## Aksesibilitas

- Teks normal minimal 4.5:1, teks besar dan elemen non-teks minimal 3:1, diverifikasi dengan `antislop-human/contrast-check.py`.
- Cincin fokus: `accent-600` (terang), `accent-300` (gelap).
- Zoom tidak diblokir (tidak ada `maximum-scale`).
