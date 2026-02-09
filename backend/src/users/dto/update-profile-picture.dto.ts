import { IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfilePictureDto {
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  avatar: string;
}
