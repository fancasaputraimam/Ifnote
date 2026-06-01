import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class AdminRowsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;
}

export class AdminUpdateRowDto {
  /** Field → nilai baru. Field immutable/secret ditolak di service. */
  @IsObject()
  data!: Record<string, unknown>;
}

export class AdminImportDto {
  /** Map nama tabel → array baris (hasil export full-db). */
  @IsObject()
  data!: Record<string, unknown[]>;
}
