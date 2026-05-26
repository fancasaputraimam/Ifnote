import { IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from "class-validator";

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(80)
  displayName?: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @IsOptional() @IsString() @MaxLength(40)
  jlptGoal?: string;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  dailyTarget?: number;
}
