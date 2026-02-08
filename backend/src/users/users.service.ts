import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

/** Select only the columns the frontend needs -- never expose passwordHash. */
const USER_SAFE_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  profile: { select: { name: true, avatarUrl: true, bio: true } },
} as const;

/** Lean select for the "my courses" list. */
const MY_COURSES_SELECT = {
  id: true,
  status: true,
  rating: true,
  createdAt: true,
  course: {
    select: {
      id: true,
      title: true,
      thumbnail: true,
      topic: { select: { id: true, name: true } },
      channel: { select: { id: true, title: true } },
      _count: { select: { videos: true } },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get user with profile by ID. Uses select so passwordHash is never fetched. */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Update the user's profile and return the updated user. */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
      select: { userId: true }, // minimal -- we re-fetch below
    });
    return this.findById(userId);
  }

  /**
   * Get all courses the user has saved or assessed.
   * Uses lean select and leverages the idx_assessments_user_status index.
   */
  async getUserCourses(userId: string) {
    return this.prisma.courseAssessment.findMany({
      where: { userId },
      select: MY_COURSES_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}
