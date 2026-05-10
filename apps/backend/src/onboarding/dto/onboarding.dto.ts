import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SkillLevel } from '@prisma/client';


export class SkillEntryDto {
  @IsUUID('all', { message: 'id de competence invalide' })
  skillId: string;

  @IsEnum(SkillLevel, {
    message: 'le niveau doit etre: beginner, intermediate ou advanced',
  })
  level: SkillLevel;
}


export class OnboardingDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'ajoutez au moins 1 competence a offrir' })
  @ArrayMaxSize(5, { message: '5 competences offertes maximum' })
  @ValidateNested({ each: true })
  @Type(() => SkillEntryDto)
  skillsOffered: SkillEntryDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'ajoutez au moins 1 competence a apprendre' })
  @ArrayMaxSize(5, { message: '5 competences recherchees maximum' })
  @ValidateNested({ each: true })
  @Type(() => SkillEntryDto)
  skillsWanted: SkillEntryDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'la ville est trop longue' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'la bio est trop longue' })
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'url d\'avatar invalide' })
  avatarUrl?: string;
}
