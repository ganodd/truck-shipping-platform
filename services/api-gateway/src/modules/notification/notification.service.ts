import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async getMyNotifications(userId: string, page: number, limit: number, unreadOnly: boolean) {
    const { notifications, total } = await this.notificationRepository.findByUser(
      userId,
      page,
      limit,
      unreadOnly,
    );
    const unreadCount = await this.notificationRepository.countUnread(userId);

    return {
      data: notifications,
      unreadCount,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');
    return this.notificationRepository.markRead(id);
  }

  async markAllRead(userId: string) {
    return this.notificationRepository.markAllRead(userId);
  }
}
