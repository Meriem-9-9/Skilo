import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SessionFilterDto {
  @IsOptional()
  @IsIn(['upcoming', 'past'], { message: 'tab must be: upcoming or past' })
  tab?: 'upcoming' | 'past' = 'upcoming';

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'confirmed', 'completed', 'cancelled', 'disputed', 'auto_completed'])
  status?: string;

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

export class DeclineCancelDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
