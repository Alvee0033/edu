import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard analytics for a user.
   * Runs 4 queries in parallel; each uses indexed columns.
   *  - assessments: idx_assessments_user_status covers both counts
   *  - progress:    idx_progress_user_watched covers aggregate + recent
   */
  async getUserDashboard(userId: string) {
    const [totalSaved, totalCompleted, watchAggregate, recentActivity] =
      await Promise.all([
        // COUNT using covering index (userId, status)
        this.prisma.courseAssessment.count({
          where: { userId },
        }),
        this.prisma.courseAssessment.count({
          where: { userId, status: 'COMPLETED' },
        }),
        // SUM only the column we need
        this.prisma.videoProgress.aggregate({
          where: { userId },
          _sum: { progressPercent: true },
          _count: { _all: true },
        }),
        // Recent 5 items with lean select (no deep joins)
        this.prisma.videoProgress.findMany({
          where: { userId },
          orderBy: { watchedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            progressPercent: true,
            watchedAt: true,
            video: { select: { id: true, title: true, youtubeVideoId: true } },
            course: { select: { id: true, title: true, thumbnail: true } },
          },
        }),
      ]);

    return {
      totalSaved,
      totalCompleted,
      totalVideosWatched: watchAggregate._count._all,
      watchProgressSum: watchAggregate._sum.progressPercent ?? 0,
      recentActivity,
    };
  }

  /**
   * Global platform stats (admin or public dashboard).
   * All counts hit primary keys; topTopics uses the courses relation count.
   */
  async getPlatformStats() {
    const [totalCourses, totalTopics, totalUsers, topTopics] =
      await Promise.all([
        this.prisma.course.count(),
        this.prisma.topic.count(),
        this.prisma.user.count(),
        this.prisma.topic.findMany({
          take: 10,
          orderBy: { courses: { _count: 'desc' } },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { courses: true } },
          },
        }),
      ]);

    return { totalCourses, totalTopics, totalUsers, topTopics };
  }
}
