import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class ExplainKotobaDto {
  @IsString() @MinLength(1) @MaxLength(80)
  jp!: string;
}

export class ExplainBunpouDto {
  @IsString() @MinLength(1) @MaxLength(120)
  pattern!: string;
}

export class CorrectSentenceDto {
  @IsString() @MinLength(1) @MaxLength(500)
  sentence!: string;
}

export class MakeExampleDto {
  @IsString() @MinLength(1) @MaxLength(200)
  topic!: string;
}

export class GenerateQuizAiDto {
  @IsOptional() @IsString() @MaxLength(200)
  topic?: string;

  @IsOptional() @IsInt() @Min(1) @Max(20)
  count?: number;
}

export class CreateHafalanAiDto {
  @IsString() @MinLength(1) @MaxLength(500)
  topic!: string;
}

export class BulkKotobaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50, { message: "Maksimal 50 kata per request" })
  @IsString({ each: true })
  words!: string[];
}

export class AnalyzeSentenceDto {
  @IsString() @MinLength(1) @MaxLength(500)
  sentence!: string;
}

export class GenerateSakubunDto {
  /**
   * Daftar id Bunpou yang dimiliki user. Backend wajib verifikasi
   * kepemilikan sebelum mengirim ke AI.
   */
  @IsArray()
  @ArrayMinSize(1, { message: "Pilih minimal satu bunpou" })
  @ArrayMaxSize(10, { message: "Maksimal 10 bunpou untuk sekali generate sakubun." })
  @IsString({ each: true })
  bunpouIds!: string[];

  @IsOptional()
  @IsIn(["beginner", "intermediate", "advanced"])
  level?: "beginner" | "intermediate" | "advanced";

  @IsOptional() @IsString() @MaxLength(200)
  topic?: string;
}

/**
 * Repair endpoint: minta AI hanya mengisi exampleMeaning
 * (terjemahan natural Bahasa Indonesia dari normalExample). Dipakai
 * saat hasil explainKotoba balik dengan kalimat contoh tapi tanpa
 * arti contoh, supaya UI bisa preview lengkap tanpa minta user
 * mengisi manual.
 */
export class TranslateExampleDto {
  /** Kotoba target (tulisan Jepang). */
  @IsString() @MinLength(1) @MaxLength(80)
  kotoba!: string;

  /** Arti kotoba dalam Bahasa Indonesia (kata, bukan kalimat). */
  @IsString() @MinLength(1) @MaxLength(200)
  meaning!: string;

  /** Kalimat contoh dalam Bahasa Jepang. */
  @IsString() @MinLength(1) @MaxLength(500)
  normalExample!: string;

  /** Pembacaan hiragana penuh dari kalimat contoh (opsional). */
  @IsOptional() @IsString() @MaxLength(500)
  exampleReading?: string;
}

/**
 * Repair endpoint: minta AI mengisi reading (hiragana) untuk satu
 * kalimat. Dipakai saat reading hilang atau terdeteksi mismatch
 * (mis. AI lama menyalin reading kalimat normal ke beginner).
 *
 * Spec PART 5: AI hanya mengembalikan reading; tidak boleh menulis
 * ulang kalimatnya.
 */
export class TranslateReadingDto {
  @IsString() @MinLength(1) @MaxLength(500)
  sentence!: string;
}
