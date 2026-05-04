import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'Upload'), {
    prefix: '/upload/', // Allows fetching local files like http://localhost:2006/upload/filename
  });
  const port = process.env.PORT ?? 2006;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is not defined');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
    
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000'], // URL de ton frontend
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // throw error if unknown fields sent
      transform: true, // auto-transform types
    }),
  );

  await app.listen(port);
  console.log('server running on : http://localhost:' + port);
}
void bootstrap();
