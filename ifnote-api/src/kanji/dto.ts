import { IsArray, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CacheKanjiDto {
  @IsString() @MinLength(1) @MaxLength(8)
  kanji!: string;

  @IsOptional() @IsString() @MaxLength(280)
  meaning?: string;

  @IsOptional() @IsString() @MaxLength(280)
  onyomi?: string;

  @IsOptional() @IsString() @MaxLength(280)
  kunyomi?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  explanation?: string;

  @IsOptional() @IsArray()
  words?: unknown[];

  @IsOptional() @IsString() @MaxLength(280)
  exampleJp?: string;

  @IsOptional() @IsString() @MaxLength(280)
  exampleId?: string;
}
