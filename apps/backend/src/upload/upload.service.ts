import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  uploadFile(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new BadRequestException('aucun fichier fourni'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'skilo/avatars' },
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException('erreur lors de l\'upload sur cloudinary'),
            );
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
