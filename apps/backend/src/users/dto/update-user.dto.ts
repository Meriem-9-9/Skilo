// users/dto/update-user.dto.ts
import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string | null }) => value?.trim() || null)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  @Transform(({ value }: { value: string | null }) => value?.trim() || null)
  bio?: string | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string | null;
}
