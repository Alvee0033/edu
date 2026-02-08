import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { YoutubeService } from '../youtube/youtube.service.js';
import { SearchCoursesDto } from './dto/search-courses.dto.js';
import { AssessCourseDto } from './dto/assess-course.dto.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

/** Only the columns the frontend needs for list views. */
const COURSE_LIST_SELECT = {
  id: true,
  title: true,
  thumbnail: true,
  createdAt: true,
  topic: { select: { id: true, name: true, slug: true } },
  channel: { select: { id: true, title: true, verified: true } },
  _count: { select: { videos: true } },
} as const;

/** Columns for course detail (includes videos). */
const COURSE_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  createdAt: true,
  topic: { select: { id: true, name: true, slug: true } },
  channel: {
    select: { id: true, title: true, channelId: true, verified: true },
  },
  videos: {
    select: {
      id: true,
      youtubeVideoId: true,
      title: true,
      durationSeconds: true,
      views: true,
      position: true,
    },
    orderBy: { position: 'asc' as const },
  },
} as const;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly youtube: YoutubeService,
  ) {}

  /**
   * Search YouTube and persist results as courses.
   * Uses a transaction to batch all DB writes into a single round-trip.
   */
  async searchAndCreate(dto: SearchCoursesDto) {
    const items = await this.youtube.searchVideos(dto.query, dto.maxResults);
    if (items.length === 0) return [];

    const slug = dto.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Batch YouTube detail calls (1 quota unit for all IDs)
    const videoIds = items.map((i) => i.id.videoId);
    const details = await this.youtube.getVideoDetails(videoIds);
    const detailMap = new Map(details.map((d) => [d.id, d]));

    // Deduplicate channels before DB writes
    const uniqueChannels = new Map(
      items.map((i) => [
        i.snippet.channelId,
        { channelId: i.snippet.channelId, title: i.snippet.channelTitle },
      ]),
    );

    // Single transaction: topic + channels + courses + videos
    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert topic once
      const topic = await tx.topic.upsert({
        where: { slug },
        update: {},
        create: { name: dto.query, slug },
        select: { id: true },
      });

      // 2. Upsert unique channels in parallel
      const channelEntries = await Promise.all(
        [...uniqueChannels.values()].map((ch) =>
          tx.youtubeChannel.upsert({
            where: { channelId: ch.channelId },
            update: { title: ch.title },
            create: ch,
            select: { id: true, channelId: true },
          }),
        ),
      );
      const channelMap = new Map(
        channelEntries.map((c) => [c.channelId, c.id]),
      );

      // 3. Create courses + nested videos in parallel
      const courses = await Promise.all(
        items.map((item) => {
          const detail = detailMap.get(item.id.videoId);
          const duration = detail
            ? this.youtube.parseDuration(detail.contentDetails.duration)
            : 0;
          const views = detail ? parseInt(detail.statistics.viewCount, 10) : 0;

          return tx.course.create({
            data: {
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.high.url,
              topicId: topic.id,
              channelId: channelMap.get(item.snippet.channelId)!,
              videos: {
                create: {
                  youtubeVideoId: item.id.videoId,
                  title: item.snippet.title,
                  durationSeconds: duration,
                  views,
                  publishedAt: new Date(item.snippet.publishedAt),
                  position: 0,
                },
              },
            },
            select: COURSE_LIST_SELECT,
          });
        }),
      );

      return courses;
    });
  }

  /**
   * List courses with optional topic filter and cursor-based pagination.
   * Uses parallel count + findMany with lean select.
   */
  async findAll(pagination: PaginationDto, topicSlug?: string) {
    const where = topicSlug ? { topic: { slug: topicSlug } } : {};

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: COURSE_LIST_SELECT,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /** Get a single course with videos (lean select, no extra joins). */
  async findOne(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: COURSE_DETAIL_SELECT,
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  /**
   * Save/assess a course for the user.
   * Uses exists check instead of full findOne to avoid unnecessary joins.
   */
  async assess(userId: string, courseId: string, dto: AssessCourseDto) {
    const exists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Course not found');

    return this.prisma.courseAssessment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        status: dto.status,
        rating: dto.rating,
        notes: dto.notes ?? '',
      },
      create: {
        userId,
        courseId,
        status: dto.status,
        rating: dto.rating,
        notes: dto.notes ?? '',
      },
      select: { id: true, status: true, rating: true, createdAt: true },
    });
  }

  /** Update video watch progress (upsert on unique constraint). */
  async updateProgress(
    userId: string,
    courseId: string,
    dto: UpdateProgressDto,
  ) {
    return this.prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId: dto.videoId } },
      update: { progressPercent: dto.progressPercent, watchedAt: new Date() },
      create: {
        userId,
        courseId,
        videoId: dto.videoId,
        progressPercent: dto.progressPercent,
      },
      select: { id: true, progressPercent: true, watchedAt: true },
    });
  }
}
