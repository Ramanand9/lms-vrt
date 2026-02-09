import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import {
  AdminMessageResponse,
  StudentMessageResponse,
} from './interfaces/admin-message-response.interface';
import { AnnouncementResponse } from './interfaces/announcement-response.interface';
import { AdminMessage, AdminMessageDocument } from './schemas/admin-message.schema';
import {
  Announcement,
  AnnouncementDocument,
} from './schemas/announcement.schema';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<Announcement>,
    @InjectModel(AdminMessage.name)
    private readonly adminMessageModel: Model<AdminMessage>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async createAnnouncement(
    adminId: string,
    dto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponse> {
    const adminObjectId = parseObjectId(adminId, 'adminId');
    const admin = await this.userModel
      .findById(adminObjectId)
      .select('_id name email')
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    const announcement = new this.announcementModel({
      title: dto.title.trim(),
      message: dto.message.trim(),
      postedBy: adminObjectId,
    });

    const saved = await announcement.save();

    return {
      id: saved.id,
      title: saved.title,
      message: saved.message,
      postedBy: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async getAnnouncements(): Promise<AnnouncementResponse[]> {
    const announcements = await this.announcementModel
      .find()
      .populate('postedBy')
      .sort({ createdAt: -1 })
      .exec();

    const result: AnnouncementResponse[] = [];

    for (const announcement of announcements) {
      const postedBy = announcement.postedBy as
        | UserDocument
        | Types.ObjectId
        | null;

      if (!postedBy || postedBy instanceof Types.ObjectId) {
        continue;
      }

      result.push(this.toAnnouncementResponse(announcement, postedBy));
    }

    return result;
  }

  async createAdminMessage(
    studentId: string,
    dto: CreateAdminMessageDto,
  ): Promise<StudentMessageResponse> {
    const studentObjectId = parseObjectId(studentId, 'studentId');
    const studentExists = await this.userModel
      .findById(studentObjectId)
      .select('_id')
      .exec();

    if (!studentExists) {
      throw new NotFoundException('Student user not found');
    }

    const message = new this.adminMessageModel({
      subject: dto.subject.trim(),
      message: dto.message.trim(),
      student: studentObjectId,
    });

    const saved = await message.save();
    return this.toStudentMessageResponse(saved);
  }

  async getAdminMessages(): Promise<AdminMessageResponse[]> {
    const messages = await this.adminMessageModel
      .find()
      .populate('student')
      .sort({ createdAt: -1 })
      .exec();

    const result: AdminMessageResponse[] = [];

    for (const message of messages) {
      const student = message.student as UserDocument | Types.ObjectId | null;

      if (!student || student instanceof Types.ObjectId) {
        continue;
      }

      result.push(this.toAdminMessageResponse(message, student));
    }

    return result;
  }

  async getMyMessages(studentId: string): Promise<StudentMessageResponse[]> {
    const messages = await this.adminMessageModel
      .find({ student: parseObjectId(studentId, 'studentId') })
      .sort({ createdAt: -1 })
      .exec();

    return messages.map((message) => this.toStudentMessageResponse(message));
  }

  private toAnnouncementResponse(
    announcement: AnnouncementDocument,
    postedBy: Pick<UserDocument, 'id' | 'name' | 'email'>,
  ): AnnouncementResponse {
    return {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      postedBy: {
        id: postedBy.id,
        name: postedBy.name,
        email: postedBy.email,
      },
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }

  private toStudentMessageResponse(
    message: AdminMessageDocument,
  ): StudentMessageResponse {
    return {
      id: message.id,
      subject: message.subject,
      message: message.message,
      createdAt: message.createdAt,
    };
  }

  private toAdminMessageResponse(
    message: AdminMessageDocument,
    student: Pick<UserDocument, 'id' | 'name' | 'email'>,
  ): AdminMessageResponse {
    return {
      id: message.id,
      subject: message.subject,
      message: message.message,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      createdAt: message.createdAt,
    };
  }
}
