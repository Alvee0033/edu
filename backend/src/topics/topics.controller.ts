import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TopicsService } from './topics.service.js';
import { CreateTopicDto } from './dto/create-topic.dto.js';

@ApiTags('Topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List all topics' })
  findAll() {
    return this.topicsService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new topic' })
  create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }
}
