import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./dto";

interface TokenPair {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Email sudah terdaftar");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name ?? null,
        profile: {
          create: { dailyTarget: 10 },
        },
        settings: {
          create: {},
        },
      },
      select: { id: true, email: true, name: true },
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!user) throw new UnauthorizedException("Email atau password salah");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Email atau password salah");

    return this.signToken({ id: user.id, email: user.email, name: user.name });
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        profile: {
          select: { displayName: true, jlptGoal: true, dailyTarget: true, avatarUrl: true },
        },
      },
    });
  }

  private signToken(user: { id: string; email: string; name: string | null }): TokenPair {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user };
  }
}
