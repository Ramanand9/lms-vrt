import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CourseMaterialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsString()
  @MaxLength(2048)
  @IsUrl()
  url: string;
}

export class CourseSubsectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @MaxLength(2048)
  @IsUrl()
  videoUrl: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseMaterialDto)
  materials?: CourseMaterialDto[];
}

export class CourseSectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseSubsectionDto)
  subsections?: CourseSubsectionDto[];
}
