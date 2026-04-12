import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SkillCategory } from 'generated/prisma/client';

export class CreateSkillDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  @IsEnum(SkillCategory, {
    message:
      'category must be: tech, languages, arts, business, sport, cooking or other',
  })
  category: SkillCategory;

  // Optional aliases the user can suggest (e.g. "JS" for JavaScript)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];
}
