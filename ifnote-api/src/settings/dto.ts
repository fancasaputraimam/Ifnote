import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class UpdateSettingsDto {
  @IsOptional() @IsIn(["system", "light", "dark"])
  theme?: "system" | "light" | "dark";

  @IsOptional() @IsIn(["beginner", "normal", "furigana"])
  jpMode?: "beginner" | "normal" | "furigana";

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
}
