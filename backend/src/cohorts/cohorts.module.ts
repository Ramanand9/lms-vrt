import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../enrollments/schemas/enrollment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CohortsController } from './cohorts.controller';
import { CohortsService } from './cohorts.service';
import {
  CohortMembership,
  CohortMembershipSchema,
} from './schemas/cohort-membership.schema';
import { Cohort, CohortSchema } from './schemas/cohort.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cohort.name, schema: CohortSchema },
      { name: CohortMembership.name, schema: CohortMembershipSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CohortsController],
  providers: [CohortsService],
})
export class CohortsModule {}
