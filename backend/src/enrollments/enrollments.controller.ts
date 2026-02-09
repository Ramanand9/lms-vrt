import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AllocateCourseDto } from './dto/allocate-course.dto';
import { EnrollmentsService } from './enrollments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.Admin)
  allocateCourse(
    @CurrentUser('id') adminId: string,
    @Body() dto: AllocateCourseDto,
  ) {
    return this.enrollmentsService.allocateCourse(adminId, dto);
  }

  @Get('my-courses')
  @Roles(Role.Student)
  getMyCourses(@CurrentUser('id') studentId: string) {
    return this.enrollmentsService.getMyCourses(studentId);
  }

  @Get('my-courses/:courseId')
  @Roles(Role.Student)
  getMyCourseById(
    @CurrentUser('id') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.getMyCourseById(studentId, courseId);
  }

  @Get('course/:courseId/students')
  @Roles(Role.Admin)
  getCourseStudents(@Param('courseId') courseId: string) {
    return this.enrollmentsService.getCourseStudents(courseId);
  }

  @Delete('course/:courseId/student/:studentId')
  @Roles(Role.Admin)
  unallocateCourse(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.enrollmentsService.unallocateCourse(courseId, studentId);
  }
}
