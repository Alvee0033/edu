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
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
      include: { profile: true },
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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
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

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
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
    const payload: JwtPayload = { sub: id, email, role };

    const tokenPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    } as Record<string, unknown>;

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
