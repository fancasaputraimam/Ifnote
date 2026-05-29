import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateSettingsDto {
  @IsOptional() @IsIn(["system", "light", "dark"])
  theme?: "system" | "light" | "dark";

  /**
   * Mode tampilan teks Jepang.
   *
   *   - "kana"     : Pemula  — hiragana/katakana saja
   *   - "furigana" : Normal  — kanji + furigana
   *   - "kanji"    : Pro     — kanji bersih
   *
   * Legacy values ("beginner", "normal") tetap diterima dan dinormalisasi
   * di service layer supaya backup JSON / klien lama tidak rusak.
   */
  @IsOptional()
  @IsIn(["kana", "furigana", "kanji", "beginner", "normal"])
  jpMode?: "kana" | "furigana" | "kanji" | "beginner" | "normal";

  @IsOptional() @IsBoolean()
  onboardingSeen?: boolean;

  @IsOptional() @IsString() @MaxLength(120)
  aiProvider?: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  aiBaseUrl?: string;

  @IsOptional() @IsString() @MaxLength(120)
  aiModelId?: string;

  @IsOptional() @IsIn(["openai", "azure", "custom"])
  aiRequestFormat?: "openai" | "azure" | "custom";

  @IsOptional() @IsBoolean()
  useRealAi?: boolean;

  /**
   * Per-user AI API key. Encrypted at rest by the service layer; never
   * returned in any API response.
   *
   * Special semantics:
   *  - omitted (`undefined`) → keep existing key
   *  - `null`                → clear stored key
   *  - non-empty string      → encrypt and replace
   */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(512)
  aiApiKey?: string | null;
}
