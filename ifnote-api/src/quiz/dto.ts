import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const QUIZ_TYPES = ["kotoba", "bunpou", "mixed", "ai"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export class QuizQueryDto {
  @IsOptional() @IsIn(QUIZ_TYPES)
  type?: QuizType;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  count?: number;
}

export class AnswerDto {
  @IsIn(QUIZ_TYPES)
  type!: QuizType;

  @IsIn(["kotoba", "bunpou"])
  itemType!: "kotoba" | "bunpou";

  @IsUUID()
  itemId!: string;

  @IsBoolean()
  correct!: boolean;
}

export class GenerateQuizDto {
  @IsOptional() @IsIn(QUIZ_TYPES)
  type?: QuizType;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  count?: number;

  @IsOptional() @IsString() @MaxLength(280)
  topic?: string;
}
