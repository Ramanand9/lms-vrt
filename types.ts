export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  sections: CourseSection[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSubsection {
  title: string;
  description?: string;
  videoUrl: string;
}

export interface CourseSection {
  title: string;
  description?: string;
  subsections: CourseSubsection[];
}

export interface StudentCourse {
  enrollmentId: string;
  allocatedAt: string;
  course: Course;
}

export interface CourseStudent {
  enrollmentId: string;
  allocatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCourseInput {
  title: string;
  description: string;
  thumbnailUrl?: string;
  price?: number;
  sections?: CourseSection[];
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price?: number;
  sections?: CourseSection[];
}

export interface AllocateCourseInput {
  courseId: string;
  studentId: string;
}

export interface CourseView {
  course: Course;
  allocatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  postedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  message: string;
}

export interface StudentAdminMessage {
  id: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface AdminInboxMessage {
  id: string;
  subject: string;
  message: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateAdminMessageInput {
  subject: string;
  message: string;
}
