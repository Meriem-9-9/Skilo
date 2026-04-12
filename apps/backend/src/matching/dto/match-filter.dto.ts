import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MatchType, SkillCategory, SkillLevel } from 'generated/prisma/client';

export class MatchFilterDto {
  @IsOptional()
  @IsEnum(MatchType, { message: 'type must be: perfect or partial' })
  type?: MatchType;

  @IsOptional()
  @IsEnum(SkillCategory, { message: 'Invalid category' })
  category?: SkillCategory;

  @IsOptional()
  @IsEnum(SkillLevel, { message: 'level must be: beginner, intermediate or advanced' })
  level?: SkillLevel;

  @IsOptional()
  @IsIn(['score', 'rating', 'sessions'], {
    message: 'sort must be: score, rating or sessions',
  })
  sort?: 'score' | 'rating' | 'sessions';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
