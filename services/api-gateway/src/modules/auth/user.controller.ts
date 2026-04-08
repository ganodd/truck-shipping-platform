import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AuthPayload } from '@truck-shipping/shared-types';
import { updateProfileSchema } from '@truck-shipping/shared-validators';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('Auth')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: AuthPayload) {
    return this.userService.getProfile(user.userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: AuthPayload, @Body() body: unknown) {
    const input = updateProfileSchema.parse(body);
    return this.userService.updateProfile(user.userId, input);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get public profile of any user' })
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
