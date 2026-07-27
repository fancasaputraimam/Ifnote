import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password minimal 8 karakter" })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
