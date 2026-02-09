import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Course,
  CourseStudent,
  CourseView,
  CreateCourseInput,
  UpdateCourseInput,
  User,
  UserRole,
} from './types';
import { API, ApiError } from './services/db';

interface ActionResult {
  success: boolean;
  message?: string;
}

interface LMSContextType {
  currentUser: User | null;
  courses: Course[];
  students: User[];
  isLoading: boolean;
  isSaving: boolean;
  login: (email: string, password: string) => Promise<ActionResult>;
  registerStudent: (
    name: string,
    email: string,
    password: string,
  ) => Promise<ActionResult>;
  registerAdmin: (
    name: string,
    email: string,
    password: string,
    setupKey: string,
  ) => Promise<ActionResult>;
  updateProfilePicture: (avatar: string) => Promise<ActionResult>;
  logout: () => void;
  refreshData: () => Promise<void>;
  createCourse: (input: CreateCourseInput) => Promise<ActionResult>;
  updateCourse: (courseId: string, input: UpdateCourseInput) => Promise<ActionResult>;
  allocateCourse: (courseId: string, studentId: string) => Promise<ActionResult>;
  fetchCourseStudents: (courseId: string) => Promise<CourseStudent[]>;
  fetchCourseView: (courseId: string) => Promise<CourseView | null>;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80';

const getAvatar = (user: Pick<User, 'name' | 'email'>) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    `${user.name}-${user.email}`,
  )}`;

const normalizeUser = (user: User): User => ({
  ...user,
  avatar: user.avatar ?? getAvatar(user),
});

const normalizeCourse = (course: Course): Course => ({
  ...course,
  thumbnailUrl: course.thumbnailUrl || DEFAULT_THUMBNAIL,
  sections: course.sections ?? [],
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error occurred';
};

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [courseStudentsCache, setCourseStudentsCache] = useState<
    Record<string, CourseStudent[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadDataForUser = async (user: User): Promise<void> => {
    if (user.role === UserRole.ADMIN) {
      const [adminCourses, studentList] = await Promise.all([
        API.fetchAdminCourses(),
        API.fetchStudents(),
      ]);

      setCourses(adminCourses.map(normalizeCourse));
      setStudents(studentList.map(normalizeUser));
      setCourseStudentsCache({});
      return;
    }

    const myCourses = await API.fetchMyCourses();
    setCourses(myCourses.map((entry) => normalizeCourse(entry.course)));
    setStudents([]);
    setCourseStudentsCache({});
  };

  const applyAuthSuccess = async (token: string, user: User): Promise<void> => {
    API.setToken(token);
    const normalizedUser = normalizeUser(user);
    setCurrentUser(normalizedUser);
    await loadDataForUser(normalizedUser);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      const token = API.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await API.getMe();
        const normalizedUser = normalizeUser(user);
        setCurrentUser(normalizedUser);
        await loadDataForUser(normalizedUser);
      } catch (error) {
        API.clearToken();
        setCurrentUser(null);
        setCourses([]);
        setStudents([]);
        setCourseStudentsCache({});
        console.error('Session restore failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<ActionResult> => {
    setIsSaving(true);

    try {
      const response = await API.login(email, password);
      await applyAuthSuccess(response.accessToken, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const registerStudent = async (
    name: string,
    email: string,
    password: string,
  ): Promise<ActionResult> => {
    setIsSaving(true);

    try {
      const response = await API.registerStudent(name, email, password);
      await applyAuthSuccess(response.accessToken, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const registerAdmin = async (
    name: string,
    email: string,
    password: string,
    setupKey: string,
  ): Promise<ActionResult> => {
    setIsSaving(true);

    try {
      const response = await API.registerAdmin(name, email, password, setupKey);
      await applyAuthSuccess(response.accessToken, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfilePicture = async (avatar: string): Promise<ActionResult> => {
    if (!currentUser) {
      return { success: false, message: 'You must be logged in' };
    }

    setIsSaving(true);

    try {
      const updatedUser = await API.updateProfilePicture(avatar);
      setCurrentUser(normalizeUser(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const logout = () => {
    API.clearToken();
    setCurrentUser(null);
    setCourses([]);
    setStudents([]);
    setCourseStudentsCache({});
  };

  const refreshData = async () => {
    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    try {
      await loadDataForUser(currentUser);
    } finally {
      setIsSaving(false);
    }
  };

  const createCourse = async (
    input: CreateCourseInput,
  ): Promise<ActionResult> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return { success: false, message: 'Only admins can create courses' };
    }

    setIsSaving(true);

    try {
      const created = await API.createCourse(input);
      setCourses((prev) => [normalizeCourse(created), ...prev]);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const updateCourse = async (
    courseId: string,
    input: UpdateCourseInput,
  ): Promise<ActionResult> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return { success: false, message: 'Only admins can edit courses' };
    }

    setIsSaving(true);

    try {
      const updated = await API.updateCourse(courseId, input);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? normalizeCourse(updated) : course,
        ),
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const allocateCourse = async (
    courseId: string,
    studentId: string,
  ): Promise<ActionResult> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return { success: false, message: 'Only admins can allocate courses' };
    }

    setIsSaving(true);

    try {
      await API.allocateCourse({ courseId, studentId });
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCourseStudents = async (courseId: string): Promise<CourseStudent[]> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return [];
    }

    const cached = courseStudentsCache[courseId];
    if (cached) {
      return cached;
    }

    const result = await API.fetchCourseStudents(courseId);
    setCourseStudentsCache((prev) => ({
      ...prev,
      [courseId]: result,
    }));

    return result;
  };

  const fetchCourseView = async (courseId: string): Promise<CourseView | null> => {
    if (!currentUser) {
      return null;
    }

    if (currentUser.role === UserRole.ADMIN) {
      const course = await API.fetchCourseById(courseId);
      return { course: normalizeCourse(course) };
    }

    const studentCourse = await API.fetchMyCourseById(courseId);

    return {
      course: normalizeCourse(studentCourse.course),
      allocatedAt: studentCourse.allocatedAt,
    };
  };

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        courses,
        students,
        isLoading,
        isSaving,
        login,
        registerStudent,
        registerAdmin,
        updateProfilePicture,
        logout,
        refreshData,
        createCourse,
        updateCourse,
        allocateCourse,
        fetchCourseStudents,
        fetchCourseView,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);

  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }

  return context;
};
