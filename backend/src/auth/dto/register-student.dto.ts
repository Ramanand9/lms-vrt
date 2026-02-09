import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
