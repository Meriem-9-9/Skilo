import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitReviewDto {
  @IsUUID('4')
  sessionId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  globalRating: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  pedagogyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctualityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
