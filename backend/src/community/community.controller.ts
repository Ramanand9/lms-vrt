import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CommunityService } from './community.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('announcements')
  @Roles(Role.Admin, Role.Student)
  getAnnouncements() {
    return this.communityService.getAnnouncements();
  }

  @Post('announcements')
  @Roles(Role.Admin)
  createAnnouncement(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.communityService.createAnnouncement(adminId, dto);
  }

  @Post('messages')
  @Roles(Role.Student)
  createAdminMessage(
    @CurrentUser('id') studentId: string,
    @Body() dto: CreateAdminMessageDto,
  ) {
    return this.communityService.createAdminMessage(studentId, dto);
  }

  @Get('messages/my')
  @Roles(Role.Student)
  getMyMessages(@CurrentUser('id') studentId: string) {
    return this.communityService.getMyMessages(studentId);
  }

  @Get('messages')
  @Roles(Role.Admin)
  getAdminMessages() {
    return this.communityService.getAdminMessages();
  }
}
