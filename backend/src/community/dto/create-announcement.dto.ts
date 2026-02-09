import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message: string;
}
