import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Security ───────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:8080'],
    credentials: true,
  });

  // ─── Global Validation ──────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── API Prefix ─────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger ────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('EduCourses API')
    .setDescription('Study Course Discovery Platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ─── Start ──────────────────────────────────────────────────────────────────
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
  console.log(`📄 Swagger docs on http://localhost:${port}/api/docs`);
}
void bootstrap();
