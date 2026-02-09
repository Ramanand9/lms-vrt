import { CourseResponse } from '../../courses/interfaces/course-response.interface';

export interface StudentCourseResponse {
  enrollmentId: string;
  allocatedAt: Date;
  course: CourseResponse;
}
