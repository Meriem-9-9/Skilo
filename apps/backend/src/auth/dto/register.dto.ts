// auth/dto/register.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mot de passe : 8 caracteres minimum' })
  @MaxLength(72, {
    message: 'Mot de passe : 72 caracteres maximum (limite bcrypt)',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mot de passe : au moins 1 majuscule, 1 minuscule et 1 chiffre',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName: string;
  @IsOptional()
  @IsUUID()
  referredById?: string;
}
