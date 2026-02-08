import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service.js';
import { TopicsController } from './topics.controller.js';

@Module({
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
