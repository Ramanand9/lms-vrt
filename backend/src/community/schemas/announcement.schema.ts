import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, versionKey: false })
export class Announcement {
  @Prop({ required: true, trim: true, maxlength: 180 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  message: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  postedBy: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type AnnouncementDocument = HydratedDocument<Announcement>;

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
