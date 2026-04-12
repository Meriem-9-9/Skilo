import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectSkillDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string; // admin can explain why (not stored in schema but returned in response)
}
