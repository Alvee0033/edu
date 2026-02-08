import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get personal dashboard analytics' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.analyticsService.getUserDashboard(userId);
  }

  @Get('platform')
  @ApiOperation({ summary: 'Get platform-wide statistics' })
  getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }
}
