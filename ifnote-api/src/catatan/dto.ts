import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CatatanQueryDto {
  @IsOptional() @IsString() @MaxLength(200)
  search?: string;

  @IsOptional() @IsIn(["all", "kotoba", "bunpou"])
  type?: "all" | "kotoba" | "bunpou";

  @IsOptional() @IsIn(["N5", "N4", "N3", "N2", "N1"])
  level?: "N5" | "N4" | "N3" | "N2" | "N1";

  @IsOptional() @IsIn(["good", "mid", "weak", "review", "new"])
  status?: "good" | "mid" | "weak" | "review" | "new";

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
