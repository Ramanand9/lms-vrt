import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { parseObjectId } from '../common/utils/parse-object-id.util';
import { Course } from '../courses/schemas/course.schema';
import { Enrollment } from '../enrollments/schemas/enrollment.schema';
import { User } from '../users/schemas/user.schema';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { JoinWithKeyDto } from './dto/join-with-key.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import {
  CohortJoinResponse,
  RotateCohortKeyResponse,
} from './interfaces/cohort-join-response.interface';
import {
  AdminCohortResponse,
  StudentCohortResponse,
} from './interfaces/cohort-response.interface';
import {
  CohortMembership,
  CohortJoinMethod,
} from './schemas/cohort-membership.schema';
import { Cohort, CohortDocument } from './schemas/cohort.schema';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class CohortsService {
  constructor(
    @InjectModel(Cohort.name)
    private readonly cohortModel: Model<Cohort>,
    @InjectModel(CohortMembership.name)
    private readonly cohortMembershipModel: Model<CohortMembership>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
    private readonly configService: ConfigService,
  ) {}

  async createCohort(
    adminId: string,
    dto: CreateCohortDto,
  ): Promise<AdminCohortResponse> {
    const createdBy = parseObjectId(adminId, 'adminId');
    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Cohort name must be at least 2 characters');
    }

    const description = dto.description?.trim();
    const courseIds = this.normalizeCourseIds(dto.courseIds);
    await this.ensureCoursesExist(courseIds);

    const inviteCode = await this.generateUniqueInviteCode();
    const { accessKey, accessKeyHash } = await this.generateUniqueAccessKey();

    const cohort = new this.cohortModel({
      name,
      description: description || undefined,
      inviteCode,
      accessKeyHash,
      courseIds,
      createdBy,
    });

    const saved = await cohort.save();

    return this.toAdminCohortResponse(saved, 0, accessKey);
  }

  async getMyAdminCohorts(adminId: string): Promise<AdminCohortResponse[]> {
    const createdBy = parseObjectId(adminId, 'adminId');

    const cohorts = await this.cohortModel
      .find({ createdBy })
      .sort({ createdAt: -1 })
      .exec();

    if (cohorts.length === 0) {
      return [];
    }

    const memberCounts = await this.getMemberCountMap(
      cohorts.map((cohort) => cohort._id as Types.ObjectId),
    );

    return cohorts.map((cohort) =>
      this.toAdminCohortResponse(cohort, memberCounts.get(cohort.id) ?? 0),
    );
  }

  async updateCohort(
    adminId: string,
    cohortId: string,
    dto: UpdateCohortDto,
  ): Promise<AdminCohortResponse> {
    const adminObjectId = parseObjectId(adminId, 'adminId');
    const cohortObjectId = parseObjectId(cohortId, 'cohortId');

    const cohort = await this.cohortModel
      .findOne({
        _id: cohortObjectId,
        createdBy: adminObjectId,
      })
      .exec();

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name.length < 2) {
        throw new BadRequestException('Cohort name must be at least 2 characters');
      }
      cohort.name = name;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      cohort.description = description.length > 0 ? description : undefined;
    }

    if (dto.courseIds !== undefined) {
      const nextCourseIds = this.normalizeCourseIds(dto.courseIds);
      await this.ensureCoursesExist(nextCourseIds);
      cohort.courseIds = nextCourseIds;
    }

    const saved = await cohort.save();
    await this.syncCohortEnrollmentsForMembers(saved);

    const memberCount = await this.cohortMembershipModel
      .countDocuments({ cohort: saved._id })
      .exec();

    return this.toAdminCohortResponse(saved, memberCount);
  }

  async rotateCohortAccessKey(
    adminId: string,
    cohortId: string,
  ): Promise<RotateCohortKeyResponse> {
    const adminObjectId = parseObjectId(adminId, 'adminId');
    const cohortObjectId = parseObjectId(cohortId, 'cohortId');

    const cohort = await this.cohortModel
      .findOne({
        _id: cohortObjectId,
        createdBy: adminObjectId,
      })
      .exec();

    if (!cohort) {
      throw new NotFoundException('Cohort not found');
    }

    const { accessKey, accessKeyHash } = await this.generateUniqueAccessKey();
    cohort.accessKeyHash = accessKeyHash;
    await cohort.save();

    return {
      cohortId: cohort.id,
      accessKey,
    };
  }

  async joinByInviteCode(
    studentId: string,
    inviteCode: string,
  ): Promise<CohortJoinResponse> {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    if (!normalizedInviteCode) {
      throw new BadRequestException('Invite code is required');
    }

    const cohort = await this.cohortModel
      .findOne({ inviteCode: normalizedInviteCode })
      .exec();

    if (!cohort) {
      throw new NotFoundException('Invalid cohort invite code');
    }

    return this.joinStudentToCohort(studentId, cohort, CohortJoinMethod.Link);
  }

  async joinByAccessKey(
    studentId: string,
    dto: JoinWithKeyDto,
  ): Promise<CohortJoinResponse> {
    const accessKey = dto.accessKey.trim();
    if (!accessKey) {
      throw new BadRequestException('Access key is required');
    }

    const accessKeyHash = this.hashAccessKey(accessKey);

    const cohort = await this.cohortModel.findOne({ accessKeyHash }).exec();

    if (!cohort) {
      throw new NotFoundException('Invalid cohort access key');
    }

    return this.joinStudentToCohort(studentId, cohort, CohortJoinMethod.Key);
  }

  async getMyCohorts(studentId: string): Promise<StudentCohortResponse[]> {
    const studentObjectId = parseObjectId(studentId, 'studentId');

    const memberships = await this.cohortMembershipModel
      .find({ student: studentObjectId })
      .populate('cohort')
      .sort({ createdAt: -1 })
      .exec();

    const result: StudentCohortResponse[] = [];

    for (const membership of memberships) {
      const cohort = membership.cohort as CohortDocument | Types.ObjectId | null;

      if (!cohort || cohort instanceof Types.ObjectId) {
        continue;
      }

      result.push({
        id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        inviteCode: cohort.inviteCode,
        courseIds: cohort.courseIds.map((courseId) => courseId.toString()),
        joinedAt: membership.createdAt,
        joinedBy: membership.joinedBy,
      });
    }

    return result;
  }

  private async joinStudentToCohort(
    studentId: string,
    cohort: CohortDocument,
    joinedBy: CohortJoinMethod,
  ): Promise<CohortJoinResponse> {
    const studentObjectId = parseObjectId(studentId, 'studentId');
    const studentExists = await this.userModel
      .findOne({ _id: studentObjectId, role: Role.Student })
      .select('_id')
      .exec();

    if (!studentExists) {
      throw new NotFoundException('Student not found');
    }

    const existingMembership = await this.cohortMembershipModel
      .findOne({
        cohort: cohort._id,
        student: studentObjectId,
      })
      .select('_id')
      .exec();

    if (existingMembership) {
      const allocatedCourses = await this.allocateCoursesToStudent(
        cohort.courseIds,
        studentObjectId,
        cohort.createdBy,
      );

      return {
        message: 'You are already in this cohort. Course access synced.',
        alreadyMember: true,
        allocatedCourses,
        cohort: this.toJoinCohortPayload(cohort),
      };
    }

    const membership = new this.cohortMembershipModel({
      cohort: cohort._id,
      student: studentObjectId,
      joinedBy,
    });

    try {
      await membership.save();
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        return this.joinStudentToCohort(studentId, cohort, joinedBy);
      }
      throw error;
    }

    const allocatedCourses = await this.allocateCoursesToStudent(
      cohort.courseIds,
      studentObjectId,
      cohort.createdBy,
    );

    return {
      message: 'Cohort joined successfully.',
      alreadyMember: false,
      allocatedCourses,
      cohort: this.toJoinCohortPayload(cohort),
    };
  }

  private toJoinCohortPayload(cohort: CohortDocument) {
    return {
      id: cohort.id,
      name: cohort.name,
      description: cohort.description,
      inviteCode: cohort.inviteCode,
    };
  }

  private async syncCohortEnrollmentsForMembers(
    cohort: CohortDocument,
  ): Promise<void> {
    if (cohort.courseIds.length === 0) {
      return;
    }

    const memberships = await this.cohortMembershipModel
      .find({ cohort: cohort._id })
      .select('student')
      .lean()
      .exec();

    const studentIds = Array.from(
      new Set(
        memberships.map((entry) => (entry.student as Types.ObjectId).toString()),
      ),
    ).map((id) => new Types.ObjectId(id));

    if (studentIds.length === 0) {
      return;
    }

    await Promise.all(
      studentIds.map((studentId) =>
        this.allocateCoursesToStudent(cohort.courseIds, studentId, cohort.createdBy),
      ),
    );
  }

  private async allocateCoursesToStudent(
    courseIds: Types.ObjectId[],
    studentId: Types.ObjectId,
    allocatedBy: Types.ObjectId,
  ): Promise<number> {
    if (courseIds.length === 0) {
      return 0;
    }

    const uniqueCourseIds = Array.from(
      new Set(courseIds.map((courseId) => courseId.toString())),
    ).map((id) => new Types.ObjectId(id));

    const existingCourses = await this.courseModel
      .find({ _id: { $in: uniqueCourseIds } })
      .select('_id')
      .lean()
      .exec();

    const validCourseIds = existingCourses.map(
      (course) => course._id as Types.ObjectId,
    );

    if (validCourseIds.length === 0) {
      return 0;
    }

    const operations = validCourseIds.map((courseId) => ({
      updateOne: {
        filter: {
          course: courseId,
          student: studentId,
        },
        update: {
          $setOnInsert: {
            course: courseId,
            student: studentId,
            allocatedBy,
          },
        },
        upsert: true,
      },
    }));

    const result = await this.enrollmentModel.bulkWrite(operations, {
      ordered: false,
    });

    return result.upsertedCount ?? 0;
  }

  private normalizeCourseIds(courseIds?: string[]): Types.ObjectId[] {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(
      new Set(courseIds.map((courseId) => courseId.trim()).filter(Boolean)),
    );

    return uniqueIds.map((courseId) => parseObjectId(courseId, 'courseId'));
  }

  private async ensureCoursesExist(courseIds: Types.ObjectId[]): Promise<void> {
    if (courseIds.length === 0) {
      return;
    }

    const count = await this.courseModel
      .countDocuments({ _id: { $in: courseIds } })
      .exec();

    if (count !== courseIds.length) {
      throw new NotFoundException('One or more selected courses were not found');
    }
  }

  private async getMemberCountMap(
    cohortIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (cohortIds.length === 0) {
      return new Map();
    }

    const rows = await this.cohortMembershipModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            cohort: {
              $in: cohortIds,
            },
          },
        },
        {
          $group: {
            _id: '$cohort',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const counts = new Map<string, number>();

    for (const row of rows) {
      counts.set(row._id.toString(), row.count);
    }

    return counts;
  }

  private toAdminCohortResponse(
    cohort: CohortDocument,
    memberCount: number,
    accessKey?: string,
  ): AdminCohortResponse {
    return {
      id: cohort.id,
      name: cohort.name,
      description: cohort.description,
      inviteCode: cohort.inviteCode,
      inviteLink: this.toInviteLink(cohort.inviteCode),
      courseIds: cohort.courseIds.map((courseId) => courseId.toString()),
      memberCount,
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
      accessKey,
    };
  }

  private toInviteLink(inviteCode: string): string {
    const frontendOrigin = this.getFrontendOrigin();
    return `${frontendOrigin}/?cohortInvite=${encodeURIComponent(inviteCode)}`;
  }

  private getFrontendOrigin(): string {
    const explicitFrontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (explicitFrontendUrl && explicitFrontendUrl.trim().length > 0) {
      return explicitFrontendUrl.trim().replace(/\/+$/, '');
    }

    const corsOrigin = this.configService.get<string>('CORS_ORIGIN');
    const firstOrigin = corsOrigin
      ?.split(',')
      .map((value) => value.trim())
      .find((value) => value.length > 0);

    if (firstOrigin) {
      return firstOrigin.replace(/\/+$/, '');
    }

    return 'http://localhost:5173';
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const inviteCode = `COH-${this.generateToken(8)}`;
      const exists = await this.cohortModel
        .exists({ inviteCode })
        .lean()
        .exec();

      if (!exists) {
        return inviteCode;
      }
    }

    throw new ConflictException('Unable to generate invite code');
  }

  private async generateUniqueAccessKey(): Promise<{
    accessKey: string;
    accessKeyHash: string;
  }> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const accessKey = `KEY-${this.generateToken(12)}`;
      const accessKeyHash = this.hashAccessKey(accessKey);
      const exists = await this.cohortModel
        .exists({ accessKeyHash })
        .lean()
        .exec();

      if (!exists) {
        return {
          accessKey,
          accessKeyHash,
        };
      }
    }

    throw new ConflictException('Unable to generate access key');
  }

  private hashAccessKey(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private generateToken(length: number): string {
    const bytes = randomBytes(length);
    let token = '';

    for (let index = 0; index < length; index += 1) {
      token += TOKEN_ALPHABET[bytes[index] % TOKEN_ALPHABET.length];
    }

    return token;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return (error as { code?: unknown }).code === 11000;
  }
}
