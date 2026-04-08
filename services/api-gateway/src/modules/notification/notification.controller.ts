import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import type { AuthPayload } from '@truck-shipping/shared-types';

import { CurrentUser } from '../../decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** GET /notifications — get my notifications */
  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  async getMyNotifications(
    @CurrentUser() user: AuthPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unread') unread?: string,
  ) {
    return this.notificationService.getMyNotifications(
      user.userId,
      Number(page),
      Number(limit),
      unread === 'true',
    );
  }

  /** PATCH /notifications/:id/read — mark a notification as read */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String })
  async markRead(@CurrentUser() user: AuthPayload, @Param('id') id: string) {
    return this.notificationService.markRead(id, user.userId);
  }

  /** PATCH /notifications/read-all — mark all notifications as read */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: AuthPayload) {
    return this.notificationService.markAllRead(user.userId);
  }
}
