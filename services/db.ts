import {
  AdminCohort,
  AdminInboxMessage,
  AllocateCourseInput,
  Announcement,
  AuthResponse,
  CohortJoinResult,
  Course,
  CourseStudent,
  CreateCohortInput,
  CreateAdminMessageInput,
  CreateAnnouncementInput,
  CreateAnnouncementResponse,
  CreateCourseInput,
  RotateCohortKeyResult,
  StudentCohort,
  StudentCourse,
  StudentAdminMessage,
  UpdateCohortInput,
  UpdateCourseInput,
  User,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
const TOKEN_STORAGE_KEY = 'lms_access_token';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class LMSApiClient {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    const token = this.getToken();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const hasJsonBody =
      init.body !== undefined && !(init.body instanceof FormData);

    if (hasJsonBody && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = this.extractErrorMessage(payload) ?? 'Request failed';
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  private extractErrorMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return typeof payload === 'string' ? payload : null;
    }

    const message = (payload as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return null;
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  registerStudent(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  registerAdmin(
    name: string,
    email: string,
    password: string,
    setupKey: string,
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register/admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, setupKey }),
    });
  }

  getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  updateProfilePicture(avatar: string): Promise<User> {
    return this.request<User>('/users/profile-picture', {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    });
  }

  fetchAdminCourses(): Promise<Course[]> {
    return this.request<Course[]>('/courses');
  }

  fetchCourseById(courseId: string): Promise<Course> {
    return this.request<Course>(`/courses/${courseId}`);
  }

  createCourse(input: CreateCourseInput): Promise<Course> {
    return this.request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateCourse(courseId: string, input: UpdateCourseInput): Promise<Course> {
    return this.request<Course>(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  deleteCourse(
    courseId: string,
  ): Promise<{ message: string; courseId: string }> {
    return this.request<{ message: string; courseId: string }>(
      `/courses/${courseId}`,
      {
        method: 'DELETE',
      },
    );
  }

  fetchStudents(): Promise<User[]> {
    return this.request<User[]>('/users/students');
  }

  allocateCourse(input: AllocateCourseInput): Promise<void> {
    return this.request<void>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  fetchMyCourses(): Promise<StudentCourse[]> {
    return this.request<StudentCourse[]>('/enrollments/my-courses');
  }

  fetchMyCourseById(courseId: string): Promise<StudentCourse> {
    return this.request<StudentCourse>(`/enrollments/my-courses/${courseId}`);
  }

  fetchCourseStudents(courseId: string): Promise<CourseStudent[]> {
    return this.request<CourseStudent[]>(
      `/enrollments/course/${courseId}/students`,
    );
  }

  unallocateCourse(
    courseId: string,
    studentId: string,
  ): Promise<{ message: string; courseId: string; studentId: string }> {
    return this.request<{ message: string; courseId: string; studentId: string }>(
      `/enrollments/course/${courseId}/student/${studentId}`,
      {
        method: 'DELETE',
      },
    );
  }

  fetchAnnouncements(): Promise<Announcement[]> {
    return this.request<Announcement[]>('/community/announcements');
  }

  createAnnouncement(
    input: CreateAnnouncementInput,
  ): Promise<CreateAnnouncementResponse> {
    return this.request<CreateAnnouncementResponse>('/community/announcements', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  sendMessageToAdmin(
    input: CreateAdminMessageInput,
  ): Promise<StudentAdminMessage> {
    return this.request<StudentAdminMessage>('/community/messages', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  fetchMyAdminMessages(): Promise<StudentAdminMessage[]> {
    return this.request<StudentAdminMessage[]>('/community/messages/my');
  }

  fetchAdminMessages(): Promise<AdminInboxMessage[]> {
    return this.request<AdminInboxMessage[]>('/community/messages');
  }

  fetchAdminCohorts(): Promise<AdminCohort[]> {
    return this.request<AdminCohort[]>('/cohorts');
  }

  createCohort(input: CreateCohortInput): Promise<AdminCohort> {
    return this.request<AdminCohort>('/cohorts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateCohort(
    cohortId: string,
    input: UpdateCohortInput,
  ): Promise<AdminCohort> {
    return this.request<AdminCohort>(`/cohorts/${cohortId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  rotateCohortKey(cohortId: string): Promise<RotateCohortKeyResult> {
    return this.request<RotateCohortKeyResult>(`/cohorts/${cohortId}/rotate-key`, {
      method: 'POST',
    });
  }

  fetchMyCohorts(): Promise<StudentCohort[]> {
    return this.request<StudentCohort[]>('/cohorts/my');
  }

  joinCohortByInviteCode(inviteCode: string): Promise<CohortJoinResult> {
    return this.request<CohortJoinResult>(
      `/cohorts/join/invite/${encodeURIComponent(inviteCode)}`,
      {
        method: 'POST',
      },
    );
  }

  joinCohortByKey(accessKey: string): Promise<CohortJoinResult> {
    return this.request<CohortJoinResult>('/cohorts/join/key', {
      method: 'POST',
      body: JSON.stringify({ accessKey }),
    });
  }
}

export const API = new LMSApiClient();
