import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, versionKey: false })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: Course.name, required: true })
  course: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  allocatedBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type EnrollmentDocument = HydratedDocument<Enrollment>;

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

EnrollmentSchema.index({ course: 1, student: 1 }, { unique: true });
