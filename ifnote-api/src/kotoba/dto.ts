import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const MASTERY = ["good", "mid", "weak"] as const;

export class CreateKotobaDto {
  @IsString() @MinLength(1) @MaxLength(120)
  jp!: string;

  @IsOptional() @IsString() @MaxLength(120)
  reading?: string;

  @IsOptional() @IsString() @MaxLength(120)
  romaji?: string;

  @IsString() @MinLength(1) @MaxLength(280)
  meaning!: string;

  @IsOptional() @IsString() @MaxLength(80)
  type?: string;

  @IsOptional() @IsIn(LEVELS)
  level?: (typeof LEVELS)[number];

  @IsOptional() @IsArray() @ArrayMaxSize(20)
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  beginnerExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  normalExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  furiganaExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  exampleReading?: string;

  @IsOptional() @IsString() @MaxLength(500)
  exampleMeaning?: string;

  @IsOptional() @IsIn(MASTERY)
  mastery?: (typeof MASTERY)[number];
}

export class UpdateKotobaDto {
  @IsOptional() @IsString() @MaxLength(120)
  jp?: string;

  @IsOptional() @IsString() @MaxLength(120)
  reading?: string;

  @IsOptional() @IsString() @MaxLength(120)
  romaji?: string;

  @IsOptional() @IsString() @MaxLength(280)
  meaning?: string;

  @IsOptional() @IsString() @MaxLength(80)
  type?: string;

  @IsOptional() @IsIn(LEVELS)
  level?: (typeof LEVELS)[number];

  @IsOptional() @IsArray() @ArrayMaxSize(20)
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  beginnerExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  normalExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  furiganaExample?: string;

  @IsOptional() @IsString() @MaxLength(500)
  exampleReading?: string;

  @IsOptional() @IsString() @MaxLength(500)
  exampleMeaning?: string;

  @IsOptional() @IsIn(MASTERY)
  mastery?: (typeof MASTERY)[number];
}
