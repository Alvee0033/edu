import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service.js';
import { SearchCoursesDto } from './dto/search-courses.dto.js';
import { AssessCourseDto } from './dto/assess-course.dto.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('search')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Search YouTube and create courses from results' })
  search(@Body() dto: SearchCoursesDto) {
    return this.coursesService.searchAndCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List courses with optional topic filter' })
  @ApiQuery({ name: 'topic', required: false })
  findAll(@Query() pagination: PaginationDto, @Query('topic') topic?: string) {
    return this.coursesService.findAll(pagination, topic);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details with videos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(':id/assess')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Save or assess a course' })
  assess(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: AssessCourseDto,
  ) {
    return this.coursesService.assess(userId, courseId, dto);
  }

  @Patch(':id/progress')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update video watch progress' })
  updateProgress(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.coursesService.updateProgress(userId, courseId, dto);
  }
}
