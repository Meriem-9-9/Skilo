import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 2006;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  app.enableCors({
    origin: 'http://localhost:2004', // URL de ton frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

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
