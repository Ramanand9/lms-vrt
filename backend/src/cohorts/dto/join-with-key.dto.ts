import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinWithKeyDto {
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  accessKey: string;
}
