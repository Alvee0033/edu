import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard analytics for a user. */
  async getUserDashboard(userId: string) {
    const [totalSaved, totalCompleted, totalWatchTime, recentActivity] =
      await Promise.all([
        this.prisma.courseAssessment.count({
          where: { userId },
        }),
        this.prisma.courseAssessment.count({
          where: { userId, status: 'COMPLETED' },
        }),
        this.prisma.videoProgress.aggregate({
          where: { userId },
          _sum: { progressPercent: true },
        }),
        this.prisma.videoProgress.findMany({
          where: { userId },
          orderBy: { watchedAt: 'desc' },
          take: 5,
          include: { video: true, course: true },
        }),
      ]);

    return {
      totalSaved,
      totalCompleted,
      watchProgressSum: totalWatchTime._sum.progressPercent ?? 0,
      recentActivity,
    };
  }

  /** Global platform stats (admin or public dashboard). */
  async getPlatformStats() {
    const [totalCourses, totalTopics, totalUsers, topTopics] =
      await Promise.all([
        this.prisma.course.count(),
        this.prisma.topic.count(),
        this.prisma.user.count(),
        this.prisma.topic.findMany({
          take: 10,
          orderBy: { courses: { _count: 'desc' } },
          include: { _count: { select: { courses: true } } },
        }),
      ]);

    return { totalCourses, totalTopics, totalUsers, topTopics };
  }
}
