import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import { CourseSectionDto } from './dto/course-content.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Enrollment } from '../enrollments/schemas/enrollment.schema';
import {
  CourseResponse,
  CourseSectionResponse,
} from './interfaces/course-response.interface';
import { Course, CourseDocument, CourseSection } from './schemas/course.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
  ) {}

  async createCourse(
    adminId: string,
    dto: CreateCourseDto,
  ): Promise<CourseResponse> {
    const course = new this.courseModel({
      title: dto.title.trim(),
      description: dto.description.trim(),
      thumbnailUrl: dto.thumbnailUrl,
      price: dto.price ?? 0,
      sections: this.mapSectionsForPersistence(dto.sections),
      createdBy: parseObjectId(adminId, 'adminId'),
    });

    const saved = await course.save();
    return this.toCourseResponse(saved);
  }

  async findAll(): Promise<CourseResponse[]> {
    const courses = await this.courseModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return courses.map((course) => this.toCourseResponse(course));
  }

  async findById(courseId: string): Promise<CourseResponse> {
    const course = await this.courseModel
      .findById(parseObjectId(courseId, 'courseId'))
      .exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.toCourseResponse(course);
  }

  async updateCourse(
    courseId: string,
    dto: UpdateCourseDto,
  ): Promise<CourseResponse> {
    const course = await this.courseModel
      .findById(parseObjectId(courseId, 'courseId'))
      .exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (dto.title !== undefined) {
      course.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      course.description = dto.description.trim();
    }

    if (dto.thumbnailUrl !== undefined) {
      course.thumbnailUrl = dto.thumbnailUrl;
    }

    if (dto.price !== undefined) {
      course.price = dto.price;
    }

    if (dto.sections !== undefined) {
      course.sections = this.mapSectionsForPersistence(dto.sections);
    }

    const saved = await course.save();
    return this.toCourseResponse(saved);
  }

  async deleteCourse(
    courseId: string,
  ): Promise<{ message: string; courseId: string }> {
    const parsedCourseId = parseObjectId(courseId, 'courseId');
    const deletedCourse = await this.courseModel
      .findByIdAndDelete(parsedCourseId)
      .exec();

    if (!deletedCourse) {
      throw new NotFoundException('Course not found');
    }

    await this.enrollmentModel.deleteMany({ course: parsedCourseId }).exec();

    return {
      message: 'Course deleted successfully',
      courseId,
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

  private mapSectionsForPersistence(
    sections: CourseSectionDto[] | undefined,
  ): CourseSection[] {
    if (!sections || sections.length === 0) {
      return [];
    }

    return sections.map((section) => ({
      title: section.title.trim(),
      description: this.toOptionalTrimmedString(section.description),
      subsections: (section.subsections ?? []).map((subsection) => ({
        title: subsection.title.trim(),
        description: this.toOptionalTrimmedString(subsection.description),
        videoUrl: subsection.videoUrl.trim(),
      })),
    }));
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
      })),
    }));
  }

  private toOptionalTrimmedString(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
