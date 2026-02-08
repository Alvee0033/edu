import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTopicDto } from './dto/create-topic.dto.js';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.topic.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateTopicDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await this.prisma.topic.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Topic already exists');

    return this.prisma.topic.create({ data: { name: dto.name, slug } });
  }
}
