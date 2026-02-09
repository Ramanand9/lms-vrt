import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;
}
