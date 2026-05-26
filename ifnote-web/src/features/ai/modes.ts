import type { AiMode } from "./types";

export interface AiModeMeta {
  key: AiMode;
  title: string;
  subtitle: string;
  icon: string;
  inputLabel: string;
  outputLabel: string;
  placeholder: string;
  /** When true, composer is multi-line. */
  multiline?: boolean;
  /** Friendly tone class for the card stripe. */
  tone: "accent" | "lilac" | "leaf";
}

export const AI_MODES: AiModeMeta[] = [
  {
    key: "explain-kotoba",
    title: "Jelaskan Kotoba",
    subtitle: "Arti, jenis kata, level, contoh",
    icon: "📖",
    inputLabel: "Kotoba (Jepang)",
    outputLabel: "Penjelasan kata + contoh",
    placeholder: "Masukkan kotoba, contoh: 食べます",
    tone: "accent",
  },
  {
    key: "explain-bunpou",
    title: "Jelaskan Bunpou",
    subtitle: "Pola, formula, contoh, kesalahan umum",
    icon: "📐",
    inputLabel: "Pola bunpou",
    outputLabel: "Penjelasan pola + contoh",
    placeholder: "Masukkan bunpou, contoh: 〜ながら",
    tone: "lilac",
  },
  {
    key: "correct-sentence",
    title: "Koreksi Kalimat",
    subtitle: "Cek kalimatmu, dapat saran perbaikan",
    icon: "🛠",
    inputLabel: "Kalimat Jepang",
    outputLabel: "Koreksi + penjelasan",
    placeholder: "Tulis kalimatmu untuk dikoreksi.",
    multiline: true,
    tone: "accent",
  },
  {
    key: "make-example",
    title: "Buat Contoh",
    subtitle: "3 contoh kalimat dengan terjemahan",
    icon: "✍️",
    inputLabel: "Topik / kata kunci",
    outputLabel: "3 contoh kalimat",
    placeholder: "Contoh: makanan / di sekolah / saya suka …",
    tone: "leaf",
  },
  {
    key: "generate-quiz",
    title: "Buat Quiz",
    subtitle: "Soal pilihan ganda dari topik",
    icon: "🎯",
    inputLabel: "Topik (opsional)",
    outputLabel: "5–10 soal pilihan ganda",
    placeholder: "Topik (opsional). Kosongkan untuk umum.",
    tone: "lilac",
  },
  {
    key: "create-hafalan",
    title: "Tambahkan ke Hafalan",
    subtitle: "Saran daftar hafalan dari topik",
    icon: "🗂",
    inputLabel: "Topik / target",
    outputLabel: "Daftar saran kotoba/bunpou",
    placeholder: "Contoh: makanan, kantor, JLPT N5 minggu 1",
    multiline: true,
    tone: "leaf",
  },
  {
    key: "bulk-kotoba",
    title: "Import Kotoba Massal",
    subtitle: "Tempel banyak kata, AI cek duplikat",
    icon: "📥",
    inputLabel: "Daftar kotoba",
    outputLabel: "Preview status: new / exists / manual",
    placeholder: "Paste banyak kotoba, satu baris satu kata",
    multiline: true,
    tone: "accent",
  },
  {
    key: "analyze-sentence",
    title: "Analisa Kalimat",
    subtitle: "Identifikasi bunpou, kotoba, partikel",
    icon: "🔬",
    inputLabel: "Kalimat Jepang",
    outputLabel: "Analisis lengkap kalimat",
    placeholder: "Masukkan kalimat Jepang yang ingin dianalisa",
    multiline: true,
    tone: "lilac",
  },
];

export function findMode(key: AiMode): AiModeMeta {
  const m = AI_MODES.find((x) => x.key === key);
  if (!m) throw new Error(`Unknown AI mode: ${key}`);
  return m;
}
