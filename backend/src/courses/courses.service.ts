import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { YoutubeService } from '../youtube/youtube.service.js';
import { SearchCoursesDto } from './dto/search-courses.dto.js';
import { AssessCourseDto } from './dto/assess-course.dto.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly youtube: YoutubeService,
  ) {}

  /** Search YouTube and persist results as courses. */
  async searchAndCreate(dto: SearchCoursesDto) {
    const items = await this.youtube.searchVideos(dto.query, dto.maxResults);
    if (items.length === 0) return [];

    // Ensure topic exists
    const slug = dto.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const topic = await this.prisma.topic.upsert({
      where: { slug },
      update: {},
      create: { name: dto.query, slug },
    });

    // Get video details for durations and views
    const videoIds = items.map((i) => i.id.videoId);
    const details = await this.youtube.getVideoDetails(videoIds);
    const detailMap = new Map(details.map((d) => [d.id, d]));

    const courses = [];

    for (const item of items) {
      // Ensure channel
      const channel = await this.prisma.youtubeChannel.upsert({
        where: { channelId: item.snippet.channelId },
        update: { title: item.snippet.channelTitle },
        create: {
          channelId: item.snippet.channelId,
          title: item.snippet.channelTitle,
        },
      });

      // Create course + video
      const detail = detailMap.get(item.id.videoId);
      const duration = detail
        ? this.youtube.parseDuration(detail.contentDetails.duration)
        : 0;
      const views = detail ? parseInt(detail.statistics.viewCount, 10) : 0;

      const course = await this.prisma.course.create({
        data: {
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high.url,
          topicId: topic.id,
          channelId: channel.id,
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
        include: { videos: true, channel: true, topic: true },
      });

      courses.push(course);
    }

    return courses;
  }

  /** List courses with optional topic filter and pagination. */
  async findAll(pagination: PaginationDto, topicSlug?: string) {
    const where = topicSlug ? { topic: { slug: topicSlug } } : {};

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          topic: true,
          channel: true,
          _count: { select: { videos: true } },
        },
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

  /** Get a single course with its videos. */
  async findOne(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topic: true,
        channel: true,
        videos: { orderBy: { position: 'asc' } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  /** Save/assess a course for the user. */
  async assess(userId: string, courseId: string, dto: AssessCourseDto) {
    // Verify course exists
    await this.findOne(courseId);

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
    });
  }

  /** Update video watch progress. */
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
    });
  }
}
