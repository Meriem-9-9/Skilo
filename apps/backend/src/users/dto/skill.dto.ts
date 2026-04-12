import { IsEnum, IsUUID } from 'class-validator';
import { SkillLevel, SkillType } from 'generated/prisma/client';

export class AddSkillDto {
  @IsUUID('4', { message: 'skillId must be a valid UUID' })
  skillId: string;

  @IsEnum(SkillType, { message: 'type must be: offered or wanted' })
  type: SkillType;

  @IsEnum(SkillLevel, {
    message: 'level must be: beginner, intermediate or advanced',
  })
  level: SkillLevel;
}

export class UpdateSkillLevelDto {
  @IsEnum(SkillLevel, {
    message: 'level must be: beginner, intermediate or advanced',
  })
  level: SkillLevel;
}
