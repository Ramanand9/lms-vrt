import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ _id: false, versionKey: false })
export class CourseSubsection {
  @Prop({ required: true, trim: true, maxlength: 150 })
  title: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ required: true, trim: true, maxlength: 2048 })
  videoUrl: string;
}

export const CourseSubsectionSchema =
  SchemaFactory.createForClass(CourseSubsection);

@Schema({ _id: false, versionKey: false })
export class CourseSection {
  @Prop({ required: true, trim: true, maxlength: 150 })
  title: string;

  @Prop({ trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ type: [CourseSubsectionSchema], default: [] })
  subsections: CourseSubsection[];
}

export const CourseSectionSchema = SchemaFactory.createForClass(CourseSection);

@Schema({ timestamps: true, versionKey: false })
export class Course {
  @Prop({ required: true, trim: true, maxlength: 150 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  description: string;

  @Prop({ trim: true })
  thumbnailUrl?: string;

  @Prop({ required: true, default: 0, min: 0 })
  price: number;

  @Prop({ type: [CourseSectionSchema], default: [] })
  sections: CourseSection[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type CourseDocument = HydratedDocument<Course>;

export const CourseSchema = SchemaFactory.createForClass(Course);
