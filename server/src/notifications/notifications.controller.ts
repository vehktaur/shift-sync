import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { NotificationsService } from './notifications.service';
import type {
  NotificationCenterResponse,
  NotificationPreferencesResponse,
  NotificationPreferencesUpdateBody,
  NotificationResponse,
} from '../scheduling/scheduling.types';

@Controller('notifications')
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getCenter(
    @CurrentUser() viewer: SessionUser,
  ): Promise<NotificationCenterResponse> {
    return this.notificationsService.getNotificationCenter(viewer);
  }

  @Get('preferences')
  async getPreferences(
    @CurrentUser() viewer: SessionUser,
  ): Promise<NotificationPreferencesResponse> {
    return this.notificationsService.getPreferences(viewer);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() viewer: SessionUser,
    @Body() body: NotificationPreferencesUpdateBody,
  ): Promise<NotificationPreferencesResponse> {
    return this.notificationsService.updatePreferences(viewer, body);
  }

  @Patch(':notificationId/read')
  async markRead(
    @CurrentUser() viewer: SessionUser,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markRead(viewer, notificationId);
  }

  @Post('actions/read-all')
  async markAllRead(
    @CurrentUser() viewer: SessionUser,
  ): Promise<NotificationCenterResponse> {
    return this.notificationsService.markAllRead(viewer);
  }
}
