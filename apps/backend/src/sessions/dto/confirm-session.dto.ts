// confirm-session.dto.ts
import { IsBoolean } from 'class-validator';

export class ConfirmSessionDto {
  @IsBoolean({ message: 'didHappen must be true or false' })
  didHappen: boolean;
}
