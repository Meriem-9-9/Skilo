import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchSkillDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;
}
