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
