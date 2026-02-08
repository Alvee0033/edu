import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get user with profile by ID. */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /** Update the user's profile. */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
    return this.findById(userId);
  }

  /** Get all courses the user has saved or assessed. */
  async getUserCourses(userId: string) {
    return this.prisma.courseAssessment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            topic: true,
            channel: true,
            _count: { select: { videos: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
