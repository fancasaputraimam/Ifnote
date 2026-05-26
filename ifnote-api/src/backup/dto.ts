import { IsArray, IsBoolean, IsObject, IsOptional } from "class-validator";

export class ImportBackupDto {
  @IsObject()
  data!: Record<string, unknown>;

  /** When true, wipe user data first then import. Default false (append). */
  @IsOptional() @IsBoolean()
  replace?: boolean;
}
