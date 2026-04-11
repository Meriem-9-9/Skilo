import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from './guards/jwt.guard';
import { BlacklistCleanupTask } from './tasks/blacklist-cleanup.task';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' }, // Access token: 15 minutes
      }),
    }),
  ],
  providers: [AuthService, PrismaService, JwtGuard, BlacklistCleanupTask],
  controllers: [AuthController],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
