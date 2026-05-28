import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { OWNER_EMAIL, isOwnerUser } from "../common/auth/owner";
import { LoginDto, RegisterDto } from "./dto";

interface TokenPair {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "owner" | "user";
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Email sudah terdaftar");

    // PART 6 — owner role pada saat register:
    //   1. kalau ini akun pertama di sistem      → owner
    //   2. kalau email cocok dengan OWNER_EMAIL  → owner
    //   3. selain itu                            → user biasa
    const role = await this.resolveRoleForRegister(email);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name ?? null,
        role,
        profile: {
          create: { dailyTarget: 10 },
        },
        settings: {
          create: {},
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "owner" | "user",
    });
  }

  /**
   * First-account-wins owner promotion. Pakai count() supaya hemat: kita
   * hanya butuh tahu apakah tabel kosong, bukan isi-nya.
   */
  private async resolveRoleForRegister(email: string): Promise<"owner" | "user"> {
    if (email === OWNER_EMAIL) return "owner";
    const count = await this.prisma.user.count();
    return count === 0 ? "owner" : "user";
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, passwordHash: true, role: true },
    });
    if (!user) throw new UnauthorizedException("Email atau password salah");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Email atau password salah");

    return this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "owner" | "user",
    });
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        role: true,
        profile: {
          select: { displayName: true, jlptGoal: true, dailyTarget: true, avatarUrl: true },
        },
      },
    });
    if (!u) return null;

    const owner = isOwnerUser({ role: u.role, email: u.email });
    // PART 7 — frontend ambil canManageAi dari sini, jangan hardcode.
    return {
      ...u,
      role: (owner ? "owner" : "user") as "owner" | "user",
      canManageAi: owner,
    };
  }

  private signToken(user: {
    id: string;
    email: string;
    name: string | null;
    role: "owner" | "user";
  }): TokenPair {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user };
  }
}
