import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('SME Backend is running, and here is the ENV variables: ', process.env);

  const corsOriginEnv = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
  const corsOrigins = corsOriginEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : undefined,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  app.use(cookieParser());

  const generatedDir = join(process.cwd(), 'generats');
  app.use('/generated', express.static(generatedDir));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
