import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { JoinWithKeyDto } from './dto/join-with-key.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cohorts')
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Get('my')
  @Roles(Role.Student)
  getMyCohorts(@CurrentUser('id') studentId: string) {
    return this.cohortsService.getMyCohorts(studentId);
  }

  @Post('join/key')
  @Roles(Role.Student)
  joinWithKey(
    @CurrentUser('id') studentId: string,
    @Body() dto: JoinWithKeyDto,
  ) {
    return this.cohortsService.joinByAccessKey(studentId, dto);
  }

  @Post('join/invite/:inviteCode')
  @Roles(Role.Student)
  joinWithInviteCode(
    @CurrentUser('id') studentId: string,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.cohortsService.joinByInviteCode(studentId, inviteCode);
  }

  @Post()
  @Roles(Role.Admin)
  createCohort(@CurrentUser('id') adminId: string, @Body() dto: CreateCohortDto) {
    return this.cohortsService.createCohort(adminId, dto);
  }

  @Get()
  @Roles(Role.Admin)
  getMyAdminCohorts(@CurrentUser('id') adminId: string) {
    return this.cohortsService.getMyAdminCohorts(adminId);
  }

  @Patch(':cohortId')
  @Roles(Role.Admin)
  updateCohort(
    @CurrentUser('id') adminId: string,
    @Param('cohortId') cohortId: string,
    @Body() dto: UpdateCohortDto,
  ) {
    return this.cohortsService.updateCohort(adminId, cohortId, dto);
  }

  @Post(':cohortId/rotate-key')
  @Roles(Role.Admin)
  rotateCohortKey(
    @CurrentUser('id') adminId: string,
    @Param('cohortId') cohortId: string,
  ) {
    return this.cohortsService.rotateCohortAccessKey(adminId, cohortId);
  }
}
