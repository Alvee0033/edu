import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TopicsModule } from './topics/topics.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { YoutubeModule } from './youtube/youtube.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

@Module({
  imports: [
    // ─── Config ───────────────────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 3 },
        { name: 'medium', ttl: 10000, limit: 20 },
        { name: 'long', ttl: 60000, limit: 100 },
      ],
    }),

    // ─── Database ─────────────────────────────────────────────────────────────
    PrismaModule,

    // ─── Feature Modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    TopicsModule,
    CoursesModule,
    YoutubeModule,
    AnalyticsModule,
  ],
  providers: [
    // Global rate-limit guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Wrap all responses in { data }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
