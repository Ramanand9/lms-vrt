import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, versionKey: false })
export class Cohort {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ required: true, trim: true, uppercase: true, maxlength: 40 })
  inviteCode: string;

  @Prop({ required: true, trim: true, maxlength: 128 })
  accessKeyHash: string;

  @Prop({ type: [Types.ObjectId], ref: Course.name, default: [] })
  courseIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type CohortDocument = HydratedDocument<Cohort>;

export const CohortSchema = SchemaFactory.createForClass(Cohort);

CohortSchema.index({ inviteCode: 1 }, { unique: true });
CohortSchema.index({ accessKeyHash: 1 }, { unique: true });
CohortSchema.index({ createdBy: 1, createdAt: -1 });
