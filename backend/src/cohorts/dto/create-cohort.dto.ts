import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  courseIds?: string[];
}
