import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { SkillCategory } from 'generated/prisma/client';

export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(SkillCategory, {
    message:
      'category must be: tech, languages, arts, business, sport, cooking or other',
  })
  category: SkillCategory;
}
