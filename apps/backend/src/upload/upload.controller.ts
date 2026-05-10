import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // POST /upload
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('aucun fichier fourni');
    }

    try {
      const result = await this.uploadService.uploadFile(file);
      return {
        avatarUrl: result.secure_url,
      };
    } catch (error) {
      throw new BadRequestException('erreur lors de l\'upload');
    }
  }
}
