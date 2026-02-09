import { IsMongoId } from 'class-validator';

export class AllocateCourseDto {
  @IsMongoId()
  courseId: string;

  @IsMongoId()
  studentId: string;
}
