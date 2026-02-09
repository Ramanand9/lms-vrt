import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { MongoServerError } from 'mongodb';
import { Model } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import { CreateUserInput } from './interfaces/create-user-input.interface';
import { PublicUser } from './interfaces/public-user.interface';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = new this.userModel({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
    });

    try {
      const saved = await user.save();
      return this.toPublicUser(saved);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('A user with this email already exists');
      }

      throw new InternalServerErrorException('Unable to create user');
    }
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findByIdWithPassword(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(parseObjectId(userId, 'userId'))
      .select('+passwordHash')
      .exec();
  }

  async findStudents(): Promise<PublicUser[]> {
    const students = await this.userModel.find({ role: Role.Student }).exec();
    return students.map((student) => this.toPublicUser(student));
  }

  async findPublicUserById(userId: string): Promise<PublicUser> {
    const user = await this.userModel
      .findById(parseObjectId(userId, 'userId'))
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async updateProfilePicture(userId: string, avatar: string): Promise<PublicUser> {
    const trimmedAvatar = avatar.trim();

    if (trimmedAvatar.length === 0) {
      throw new BadRequestException('avatar cannot be empty');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        parseObjectId(userId, 'userId'),
        { avatar: trimmedAvatar },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    if (newPassword.trim().length === 0) {
      throw new BadRequestException('newPassword cannot be empty');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await this.userModel
      .updateOne({ _id: parseObjectId(userId, 'userId') }, { passwordHash })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  toPublicUser(
    user: Pick<UserDocument, 'id' | 'name' | 'email' | 'role' | 'avatar'>,
  ): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }
}
