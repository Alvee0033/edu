import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

/** Only the columns auth needs -- avoids fetching description, timestamps, etc. */
const AUTH_USER_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  profile: { select: { name: true } },
} as const;

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Register a new user and return tokens. */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check existence with minimal select (just id)
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: { create: { name: dto.name } },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { name: true } },
      },
    });

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
      user.profile?.name ?? '',
    );
  }

  /** Validate credentials and return tokens. */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Fetch only the columns needed for password check + token
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: AUTH_USER_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
      user.profile?.name ?? '',
    );
  }

  /** Issue new access token from a valid refresh token. */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // Minimal fetch -- only what the token response needs
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { name: true } },
        },
      });
      if (!user) throw new UnauthorizedException('User not found');

      return this.buildAuthResponse(
        user.id,
        user.email,
        user.role,
        user.profile?.name ?? '',
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildAuthResponse(
    id: string,
    email: string,
    role: string,
    name: string,
  ): AuthResponseDto {
    const tokenPayload = { sub: id, email, role } as Record<string, unknown>;

    const accessToken = this.jwt.sign(tokenPayload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: 900, // 15 minutes
    });

    const refreshToken = this.jwt.sign(tokenPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: 604800, // 7 days
    });

    return { accessToken, refreshToken, user: { id, email, name, role } };
  }
}
