export interface CourseStudentResponse {
  enrollmentId: string;
  allocatedAt: Date;
  student: {
    id: string;
    name: string;
    email: string;
  };
}
