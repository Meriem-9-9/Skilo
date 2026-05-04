import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ProposeSessionDto {
  @IsUUID('4')
  recipientId: string;

  // ISO 8601 string — validated for +2h / +30d in the service
  @IsISO8601({}, { message: 'scheduledAt must be a valid date (ISO 8601)' })
  scheduledAt: string;

  @IsIn([30, 60, 90, 120], {
    message: 'duration must be 30, 60, 90 or 120 minutes',
  })
  duration: number;

  @IsOptional()
  @IsUUID('4')
  offeredSkillId?: string; // what the initiator teaches

  @IsOptional()
  @IsUUID('4')
  wantedSkillId?: string; // what the initiator learns

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;
}
