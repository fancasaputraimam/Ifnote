/**
 * Shared types between API client and feature modules. Keep narrow and only
 * fill in fields we actually use in the frontend. Server is the source of
 * truth — these are response shapes, not Prisma rows.
 */

export type Mastery = "good" | "mid" | "weak";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ThemeMode = "system" | "light" | "dark";
/**
 * Mode tampilan teks Jepang.
 *
 *   - "beginner" : Pemula — hiragana/katakana saja sebagai teks utama,
 *                  tanpa kanji, tanpa furigana, tanpa baris よみ
 *   - "normal"   : Normal — kanji dengan furigana (atau baris よみ
 *                  helper kalau alignment tidak reliable)
 *   - "pro"      : Pro — kanji bersih, tanpa furigana, tanpa よみ
 *
 * Legacy values ("kana"/"furigana"/"kanji" dan lama "advanced")
 * dinormalisasi di `normalizeJpMode` (frontend) + backend
 * `settings.service` saat read/write supaya data lama tidak rusak.
 */
export type JpMode = "beginner" | "normal" | "pro";
export type AiRequestFormat = "openai" | "azure" | "custom";
export type HafalanMode = "kotoba" | "bunpou" | "mixed" | "weak";
export type QuizType = "kotoba" | "bunpou" | "mixed" | "ai" | "sakubun";
export type NoteType = "kotoba" | "bunpou";
export type UserRole = "owner" | "user";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  /** True kalau user boleh edit AI configuration di Settings. */
  canManageAi: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  canManageAi: boolean;
  createdAt: string;
  profile?: {
    displayName: string | null;
    jlptGoal: string | null;
    dailyTarget: number;
    avatarUrl: string | null;
  } | null;
}

export interface Kotoba {
  id: string;
  jp: string;
  reading: string | null;
  romaji: string | null;
  meaning: string;
  type: string | null;
  level: JlptLevel | null;
  tags: string[];
  beginnerExample: string | null;
  beginnerExampleReading: string | null;
  beginnerExampleMeaning: string | null;
  normalExample: string | null;
  normalExampleReading: string | null;
  normalExampleMeaning: string | null;
  furiganaExample: string | null;
  exampleReading: string | null;
  exampleMeaning: string | null;
  mastery: Mastery;
  createdAt: string;
  updatedAt: string;
}

export interface Bunpou {
  id: string;
  pattern: string;
  reading: string | null;
  meaning: string;
  formula: string | null;
  usage: string | null;
  level: JlptLevel | null;
  tags: string[];
  beginnerExample: string | null;
  beginnerExampleReading: string | null;
  beginnerExampleMeaning: string | null;
  normalExample: string | null;
  normalExampleReading: string | null;
  normalExampleMeaning: string | null;
  furiganaExample: string | null;
  exampleReading: string | null;
  exampleMeaning: string | null;
  note: string | null;
  commonMistake: string | null;
  mastery: Mastery;
  createdAt: string;
  updatedAt: string;
}

export interface CatatanItem {
  id: string;
  noteType: NoteType;
  jpOrPattern: string;
  meaning: string;
  level: JlptLevel | null;
  mastery: Mastery;
  tags: string[];
  example: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CatatanList {
  items: CatatanItem[];
  pagination: { page: number; limit: number; total: number };
}

export interface HafalanSlide {
  mode: HafalanMode;
  slide: number;
  slideSize: number;
  totalSlides: number;
  totalItems: number;
  items: Array<{
    orderRefId: string;
    orderIndex: number;
    itemType: NoteType;
    itemId: string;
    jpOrPattern: string;
    /** Reading hiragana untuk kanji utama (untuk furigana). */
    reading: string | null;
    meaning: string;
    level: JlptLevel | null;
    mastery: Mastery;
    example: string | null;
    /** Reading hiragana untuk contoh kalimat (untuk furigana di contoh). */
    exampleReading: string | null;
  }>;
}

export interface QuizQuestion {
  id: string;
  itemType: NoteType;
  itemId: string;
  prompt: string;
  /** Reading hiragana penuh untuk prompt — dipakai mode Pemula (kana). */
  reading?: string | null;
  meaning?: string;
  choices: { id: string; label: string }[];
  correctChoiceId: string;
}

/**
 * Settings response is **role-aware**: owner gets the full AI config block,
 * normal users only get UI prefs + a `canManageAi=false` flag.
 *
 * Use the `canManageAi` discriminator to narrow:
 *
 *   if (settings.canManageAi) {
 *     settings.aiBaseUrl // ✅ OwnerAppSettings
 *   }
 */
export interface BaseAppSettings {
  id: string;
  userId: string;
  theme: ThemeMode;
  jpMode: JpMode;
  onboardingSeen: boolean;
  /** True kalau backend secara umum bisa melayani AI. */
  aiAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerAppSettings extends BaseAppSettings {
  canManageAi: true;
  aiProvider: string | null;
  aiBaseUrl: string | null;
  aiModelId: string | null;
  aiRequestFormat: AiRequestFormat;
  useRealAi: boolean;
  /** True if backend has an encrypted AI API key on file. Never the key itself. */
  hasAiApiKey: boolean;
  /** Display-only mask of the saved key (e.g. "sk-••••1234"). */
  aiApiKeyHint: string | null;
}

export interface NormalAppSettings extends BaseAppSettings {
  canManageAi: false;
}

export type AppSettings = OwnerAppSettings | NormalAppSettings;

export interface AiResult<T = unknown> {
  source: "ai";
  data: T;
}
