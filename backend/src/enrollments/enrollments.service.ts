import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model, Types } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import {
  CourseResponse,
  CourseSectionResponse,
} from '../courses/interfaces/course-response.interface';
import {
  Course,
  CourseDocument,
  CourseSection,
} from '../courses/schemas/course.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AllocateCourseDto } from './dto/allocate-course.dto';
import { AllocationResponse } from './interfaces/allocation-response.interface';
import { CourseStudentResponse } from './interfaces/course-student-response.interface';
import { StudentCourseResponse } from './interfaces/student-course-response.interface';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async allocateCourse(
    adminId: string,
    dto: AllocateCourseDto,
  ): Promise<AllocationResponse> {
    const courseObjectId = parseObjectId(dto.courseId, 'courseId');
    const studentObjectId = parseObjectId(dto.studentId, 'studentId');

    const [student, course] = await Promise.all([
      this.userModel
        .findOne({ _id: studentObjectId, role: Role.Student })
        .select('_id')
        .exec(),
      this.courseModel.findById(courseObjectId).select('_id').exec(),
    ]);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = new this.enrollmentModel({
      course: courseObjectId,
      student: studentObjectId,
      allocatedBy: parseObjectId(adminId, 'adminId'),
    });

    try {
      const saved = await enrollment.save();
      return this.toAllocationResponse(saved);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Student is already allocated to this course',
        );
      }

      throw error;
    }
  }

  async getMyCourses(studentId: string): Promise<StudentCourseResponse[]> {
    const enrollments = await this.enrollmentModel
      .find({ student: parseObjectId(studentId, 'studentId') })
      .populate('course')
      .sort({ createdAt: -1 })
      .exec();

    const result: StudentCourseResponse[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.course as
        | CourseDocument
        | Types.ObjectId
        | null;

      if (!course || course instanceof Types.ObjectId) {
        continue;
      }

      result.push({
        enrollmentId: enrollment.id,
        allocatedAt: enrollment.createdAt,
        course: this.toCourseResponse(course),
      });
    }

    return result;
  }

  async getMyCourseById(
    studentId: string,
    courseId: string,
  ): Promise<StudentCourseResponse> {
    const enrollment = await this.enrollmentModel
      .findOne({
        student: parseObjectId(studentId, 'studentId'),
        course: parseObjectId(courseId, 'courseId'),
      })
      .populate('course')
      .exec();

    if (!enrollment) {
      throw new NotFoundException('Course access not found for this student');
    }

    const course = enrollment.course as CourseDocument | Types.ObjectId | null;

    if (!course || course instanceof Types.ObjectId) {
      throw new NotFoundException('Course not found');
    }

    return {
      enrollmentId: enrollment.id,
      allocatedAt: enrollment.createdAt,
      course: this.toCourseResponse(course),
    };
  }

  async getCourseStudents(courseId: string): Promise<CourseStudentResponse[]> {
    const courseObjectId = parseObjectId(courseId, 'courseId');
    const courseExists = await this.courseModel
      .findById(courseObjectId)
      .select('_id')
      .exec();

    if (!courseExists) {
      throw new NotFoundException('Course not found');
    }

    const enrollments = await this.enrollmentModel
      .find({ course: courseObjectId })
      .populate('student')
      .sort({ createdAt: -1 })
      .exec();

    const result: CourseStudentResponse[] = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student as
        | UserDocument
        | Types.ObjectId
        | null;

      if (!student || student instanceof Types.ObjectId) {
        continue;
      }

      result.push({
        enrollmentId: enrollment.id,
        allocatedAt: enrollment.createdAt,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
      });
    }

    return result;
  }

  async unallocateCourse(
    courseId: string,
    studentId: string,
  ): Promise<{ message: string; courseId: string; studentId: string }> {
    const deleted = await this.enrollmentModel
      .findOneAndDelete({
        course: parseObjectId(courseId, 'courseId'),
        student: parseObjectId(studentId, 'studentId'),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Enrollment not found');
    }

    return {
      message: 'Enrollment removed successfully',
      courseId,
      studentId,
    };
  }

  private toAllocationResponse(
    enrollment: EnrollmentDocument,
  ): AllocationResponse {
    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.course.toString(),
      studentId: enrollment.student.toString(),
      allocatedBy: enrollment.allocatedBy.toString(),
      allocatedAt: enrollment.createdAt,
    };
  }

  private toCourseResponse(course: CourseDocument): CourseResponse {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price,
      sections: this.mapSectionsForResponse(course.sections),
      createdBy: course.createdBy.toString(),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private mapSectionsForResponse(
    sections: CourseSection[] | undefined,
  ): CourseSectionResponse[] {
    if (!sections || sections.length === 0) {
      return [];
    }

    return sections.map((section) => ({
      title: section.title,
      description: section.description,
      subsections: (section.subsections ?? []).map((subsection) => ({
        title: subsection.title,
        description: subsection.description,
        videoUrl: subsection.videoUrl,
        materials: (subsection.materials ?? []).map((material) => ({
          title: material.title,
          url: material.url,
        })),
      })),
    }));
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }
}
