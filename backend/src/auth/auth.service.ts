import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/interfaces/public-user.interface';

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerStudent(dto: RegisterStudentDto): Promise<AuthResponse> {
    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.Student,
    });

    return this.buildAuthResponse(user);
  }

  async registerAdmin(dto: RegisterAdminDto): Promise<AuthResponse> {
    const configuredSetupKey =
      this.configService.get<string>('ADMIN_SETUP_KEY');

    if (!configuredSetupKey) {
      throw new ForbiddenException('ADMIN_SETUP_KEY is not configured');
    }

    if (dto.setupKey !== configuredSetupKey) {
      throw new UnauthorizedException('Invalid admin setup key');
    }

    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.Admin,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(this.usersService.toPublicUser(user));
  }

  async getMe(user: AuthenticatedUser | undefined): Promise<PublicUser> {
    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.usersService.findPublicUserById(user.id);
  }

  async changePassword(
    user: AuthenticatedUser | undefined,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'newPassword must be different from currentPassword',
      );
    }

    const persistedUser = await this.usersService.findByIdWithPassword(user.id);

    if (!persistedUser) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      persistedUser.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    await this.usersService.updatePassword(user.id, dto.newPassword);

    return { message: 'Password updated successfully' };
  }

  signout(): { message: string } {
    return {
      message:
        'Signed out successfully. Remove the access token on the client.',
    };
  }

  private async buildAuthResponse(user: PublicUser): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user,
    };
  }
}
