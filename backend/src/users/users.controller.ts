import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateProfilePictureDto } from './dto/update-profile-picture.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile-picture')
  updateProfilePicture(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfilePictureDto,
  ) {
    return this.usersService.updateProfilePicture(userId, dto.avatar);
  }

  @Get('students')
  @Roles(Role.Admin)
  findStudents() {
    return this.usersService.findStudents();
  }
}
