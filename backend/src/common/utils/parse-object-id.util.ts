import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export function parseObjectId(value: string, fieldName = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }

  return new Types.ObjectId(value);
}
