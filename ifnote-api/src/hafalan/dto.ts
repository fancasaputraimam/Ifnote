import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export const HAFALAN_MODES = ["kotoba", "bunpou", "mixed", "weak"] as const;
export type HafalanMode = (typeof HAFALAN_MODES)[number];

export class HafalanQueryDto {
  @IsOptional() @IsIn(HAFALAN_MODES)
  mode?: HafalanMode;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  slide?: number;
}

export class AddHafalanDto {
  @IsIn(["kotoba", "bunpou"])
  itemType!: "kotoba" | "bunpou";

  @IsUUID()
  itemId!: string;
}

export class UpdateMasteryDto {
  @IsIn(["kotoba", "bunpou"])
  itemType!: "kotoba" | "bunpou";

  @IsUUID()
  itemId!: string;

  @IsIn(["good", "mid", "weak"])
  mastery!: "good" | "mid" | "weak";
}

export class ShufflePreviewDto {
  @IsOptional() @IsIn(HAFALAN_MODES)
  mode?: HafalanMode;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  slide?: number;

  @IsOptional() @IsArray() @ArrayMaxSize(1000) @IsString({ each: true })
  itemIds?: string[];
}
