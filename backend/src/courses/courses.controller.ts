import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.Admin)
  createCourse(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(adminId, dto);
  }

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':courseId')
  @Roles(Role.Admin)
  findById(@Param('courseId') courseId: string) {
    return this.coursesService.findById(courseId);
  }

  @Put(':courseId')
  @Roles(Role.Admin)
  updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(courseId, dto);
  }

  @Delete(':courseId')
  @Roles(Role.Admin)
  deleteCourse(@Param('courseId') courseId: string) {
    return this.coursesService.deleteCourse(courseId);
  }
}
