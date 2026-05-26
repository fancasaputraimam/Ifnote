/**
 * Shared types between API client and feature modules. Keep narrow and only
 * fill in fields we actually use in the frontend. Server is the source of
 * truth — these are response shapes, not Prisma rows.
 */

export type Mastery = "good" | "mid" | "weak";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ThemeMode = "system" | "light" | "dark";
export type JpMode = "beginner" | "normal" | "furigana";
export type AiRequestFormat = "openai" | "azure" | "custom";
export type HafalanMode = "kotoba" | "bunpou" | "mixed" | "weak";
export type QuizType = "kotoba" | "bunpou" | "mixed" | "ai";
export type NoteType = "kotoba" | "bunpou";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface MeResponse extends SessionUser {
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
  romaji: string | null;
  meaning: string;
  type: string | null;
  level: JlptLevel | null;
  tags: string[];
  beginnerExample: string | null;
  normalExample: string | null;
  furiganaExample: string | null;
  exampleMeaning: string | null;
  mastery: Mastery;
  createdAt: string;
  updatedAt: string;
}

export interface Bunpou {
  id: string;
  pattern: string;
  meaning: string;
  formula: string | null;
  usage: string | null;
  level: JlptLevel | null;
  tags: string[];
  beginnerExample: string | null;
  normalExample: string | null;
  furiganaExample: string | null;
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
    meaning: string;
    level: JlptLevel | null;
    mastery: Mastery;
    example: string | null;
  }>;
}

export interface QuizQuestion {
  id: string;
  itemType: NoteType;
  itemId: string;
  prompt: string;
  meaning?: string;
  choices: { id: string; label: string }[];
  correctChoiceId: string;
}

export interface AppSettings {
  id: string;
  userId: string;
  theme: ThemeMode;
  jpMode: JpMode;
  onboardingSeen: boolean;
  aiProvider: string | null;
  aiBaseUrl: string | null;
  aiModelId: string | null;
  aiRequestFormat: AiRequestFormat;
  useRealAi: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiResult<T = unknown> {
  source: "ai" | "mock";
  data: T;
}
