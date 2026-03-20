import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import nodemailer, { Transporter } from 'nodemailer';
import { Role } from '../common/enums/role.enum';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import {
  AdminMessageResponse,
  StudentMessageResponse,
} from './interfaces/admin-message-response.interface';
import {
  AnnouncementEmailDeliveryResponse,
  AnnouncementResponse,
  CreateAnnouncementResponse,
} from './interfaces/announcement-response.interface';
import { AdminMessage, AdminMessageDocument } from './schemas/admin-message.schema';
import {
  Announcement,
  AnnouncementDocument,
} from './schemas/announcement.schema';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  private readonly announcementEmailTransporter: Transporter | null;
  private readonly announcementEmailFrom: string | null;

  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<Announcement>,
    @InjectModel(AdminMessage.name)
    private readonly adminMessageModel: Model<AdminMessage>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const username = this.configService.get<string>('SMTP_USER')?.trim();
    const password = this.configService.get<string>('SMTP_PASS')?.trim();
    const from = this.configService.get<string>('SMTP_FROM')?.trim() ?? username;
    const secure =
      this.configService.get<string>('SMTP_SECURE')?.trim().toLowerCase() ===
      'true';

    const port = Number.parseInt(portRaw ?? '587', 10);
    const hasValidSmtpConfig = Boolean(
      host && Number.isFinite(port) && port > 0 && username && password && from,
    );

    if (!hasValidSmtpConfig) {
      this.announcementEmailTransporter = null;
      this.announcementEmailFrom = null;
      this.logger.warn(
        'Announcement email automation is disabled. Configure SMTP_* env vars to enable it.',
      );
      return;
    }

    this.announcementEmailTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: username,
        pass: password,
      },
    });
    this.announcementEmailFrom = from ?? null;
  }

  async createAnnouncement(
    adminId: string,
    dto: CreateAnnouncementDto,
  ): Promise<CreateAnnouncementResponse> {
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
    const emailDelivery = await this.sendAnnouncementEmailToStudents(admin, saved);

    return {
      announcement: {
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
      },
      emailDelivery,
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

  private async sendAnnouncementEmailToStudents(
    admin: Pick<UserDocument, 'name' | 'email'>,
    announcement: AnnouncementDocument,
  ): Promise<AnnouncementEmailDeliveryResponse> {
    if (!this.announcementEmailTransporter || !this.announcementEmailFrom) {
      return {
        enabled: false,
        attempted: 0,
        sent: 0,
        failed: 0,
      };
    }

    const students = await this.userModel
      .find({ role: Role.Student })
      .select('name email')
      .lean()
      .exec();

    if (students.length === 0) {
      return {
        enabled: true,
        attempted: 0,
        sent: 0,
        failed: 0,
      };
    }

    const recipients = students
      .filter((student) => typeof student.email === 'string')
      .map((student) => ({
        name:
          typeof student.name === 'string' && student.name.trim().length > 0
            ? student.name.trim()
            : 'Student',
        email: student.email.trim(),
      }))
      .filter((student) => student.email.length > 0);

    if (recipients.length === 0) {
      return {
        enabled: true,
        attempted: 0,
        sent: 0,
        failed: 0,
      };
    }

    const transporter = this.announcementEmailTransporter;
    const from = this.announcementEmailFrom;
    if (!transporter || !from) {
      return {
        enabled: false,
        attempted: 0,
        sent: 0,
        failed: 0,
      };
    }

    const sends = recipients.map((recipient) =>
      transporter.sendMail({
        from,
        to: recipient.email,
        subject: `[LMS Announcement] ${announcement.title}`,
        text: [
          `Hi ${recipient.name},`,
          '',
          `${admin.name} posted a new announcement:`,
          `${announcement.title}`,
          '',
          announcement.message,
          '',
          `Posted by ${admin.name} (${admin.email})`,
        ].join('\n'),
        html: [
          `<p>Hi ${this.escapeHtml(recipient.name)},</p>`,
          `<p><strong>${this.escapeHtml(
            admin.name,
          )}</strong> posted a new announcement:</p>`,
          `<h2>${this.escapeHtml(announcement.title)}</h2>`,
          `<p style="white-space: pre-wrap;">${this.escapeHtml(
            announcement.message,
          )}</p>`,
          `<p style="color:#64748b;font-size:12px;">Posted by ${this.escapeHtml(
            admin.name,
          )} (${this.escapeHtml(admin.email)})</p>`,
        ].join(''),
      }),
    );

    const results = await Promise.allSettled(sends);
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      this.logger.warn(
        `Announcement email delivery had ${failures.length} failure(s) out of ${results.length} recipient(s).`,
      );
    }

    return {
      enabled: true,
      attempted: results.length,
      sent: results.length - failures.length,
      failed: failures.length,
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
