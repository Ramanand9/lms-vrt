import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Cohort } from './cohort.schema';
import { User } from '../../users/schemas/user.schema';

export enum CohortJoinMethod {
  Link = 'link',
  Key = 'key',
}

@Schema({ timestamps: true, versionKey: false })
export class CohortMembership {
  @Prop({ type: Types.ObjectId, ref: Cohort.name, required: true })
  cohort: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  student: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(CohortJoinMethod),
  })
  joinedBy: CohortJoinMethod;

  createdAt: Date;

  updatedAt: Date;
}

export type CohortMembershipDocument = HydratedDocument<CohortMembership>;

export const CohortMembershipSchema =
  SchemaFactory.createForClass(CohortMembership);

CohortMembershipSchema.index({ cohort: 1, student: 1 }, { unique: true });
CohortMembershipSchema.index({ student: 1, createdAt: -1 });
