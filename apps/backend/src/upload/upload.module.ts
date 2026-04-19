import { UploadController } from './upload.controller';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class UploadModule {}
