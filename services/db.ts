import {
  AdminInboxMessage,
  AllocateCourseInput,
  Announcement,
  AuthResponse,
  Course,
  CourseStudent,
  CreateAdminMessageInput,
  CreateAnnouncementInput,
  CreateCourseInput,
  StudentCourse,
  StudentAdminMessage,
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

  fetchAnnouncements(): Promise<Announcement[]> {
    return this.request<Announcement[]>('/community/announcements');
  }

  createAnnouncement(
    input: CreateAnnouncementInput,
  ): Promise<Announcement> {
    return this.request<Announcement>('/community/announcements', {
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
}

export const API = new LMSApiClient();
