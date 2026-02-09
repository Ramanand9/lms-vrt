import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true, versionKey: false })
export class AdminMessage {
  @Prop({ required: true, trim: true, maxlength: 150 })
  subject: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  message: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  student: Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

export type AdminMessageDocument = HydratedDocument<AdminMessage>;

export const AdminMessageSchema = SchemaFactory.createForClass(AdminMessage);
