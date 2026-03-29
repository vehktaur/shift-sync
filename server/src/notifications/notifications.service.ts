import { Injectable, NotFoundException } from '@nestjs/common';
import type { Notification, NotificationPreference } from '@prisma/client';
import { DateTime } from 'luxon';

import type { SessionUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import {
  NotificationCenterResponse,
  NotificationPreferencesResponse,
  NotificationPreferencesUpdateBody,
  NotificationResponse,
  NotificationType,
} from '../scheduling/scheduling.types';
import { RealtimeService } from '../realtime/realtime.service';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  scheduleUpdates: true,
  coverageUpdates: true,
  overtimeWarnings: true,
  availabilityUpdates: true,
} as const;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async getNotificationCenter(
    viewer: SessionUser,
  ): Promise<NotificationCenterResponse> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAtUtc: 'desc' },
    });

    return {
      unreadCount: notifications.filter((notification) => !notification.readAtUtc)
        .length,
      notifications: notifications.map((notification) =>
        this.toNotificationResponse(notification),
      ),
    };
  }

  async getPreferences(
    viewer: SessionUser,
  ): Promise<NotificationPreferencesResponse> {
    return this.toPreferencesResponse(
      await this.getPreferenceRecordForUser(viewer.id),
    );
  }

  async updatePreferences(
    viewer: SessionUser,
    body: NotificationPreferencesUpdateBody,
  ): Promise<NotificationPreferencesResponse> {
    const preference = await this.prisma.notificationPreference.upsert({
      where: { userId: viewer.id },
      update: {
        scheduleUpdates: body.scheduleUpdates,
        coverageUpdates: body.coverageUpdates,
        overtimeWarnings: body.overtimeWarnings,
        availabilityUpdates: body.availabilityUpdates,
      },
      create: {
        userId: viewer.id,
        scheduleUpdates:
          body.scheduleUpdates ??
          DEFAULT_NOTIFICATION_PREFERENCES.scheduleUpdates,
        coverageUpdates:
          body.coverageUpdates ??
          DEFAULT_NOTIFICATION_PREFERENCES.coverageUpdates,
        overtimeWarnings:
          body.overtimeWarnings ??
          DEFAULT_NOTIFICATION_PREFERENCES.overtimeWarnings,
        availabilityUpdates:
          body.availabilityUpdates ??
          DEFAULT_NOTIFICATION_PREFERENCES.availabilityUpdates,
      },
    });

    this.realtimeService.publish({
      topic: 'notifications.updated',
      visibility: { userIds: [viewer.id] },
    });

    return this.toPreferencesResponse(preference);
  }

  async markRead(
    viewer: SessionUser,
    notificationId: string,
  ): Promise<NotificationResponse> {
    const notification = await this.getNotificationForViewer(
      viewer.id,
      notificationId,
    );

    if (!notification.readAtUtc) {
      const readAtUtc = new Date();
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { readAtUtc },
      });
      notification.readAtUtc = readAtUtc;
      this.realtimeService.publish({
        topic: 'notifications.updated',
        visibility: { userIds: [viewer.id] },
      });
    }

    return this.toNotificationResponse(notification);
  }

  async markAllRead(viewer: SessionUser): Promise<NotificationCenterResponse> {
    const now = new Date();

    await this.prisma.notification.updateMany({
      where: {
        userId: viewer.id,
        readAtUtc: null,
      },
      data: {
        readAtUtc: now,
      },
    });

    this.realtimeService.publish({
      topic: 'notifications.updated',
      visibility: { userIds: [viewer.id] },
    });

    return this.getNotificationCenter(viewer);
  }

  async createNotifications(params: {
    userIds: string[];
    type: NotificationType;
    title: string;
    body: string;
  }) {
    const uniqueUserIds = Array.from(new Set(params.userIds));

    if (uniqueUserIds.length === 0) {
      return;
    }

    const preferences = await this.getPreferenceRecordsForUsers(uniqueUserIds);
    const targetUserIds = uniqueUserIds.filter((userId) => {
      const preference = preferences.get(userId);
      return preference && this.isTypeEnabled(preference, params.type);
    });

    if (targetUserIds.length === 0) {
      return;
    }

    const createdAtUtc = new Date();
    await this.prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        id: crypto.randomUUID(),
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        createdAtUtc,
      })),
    });

    if (targetUserIds.length > 0) {
      this.realtimeService.publish({
        topic: 'notifications.updated',
        visibility: {
          userIds: targetUserIds,
        },
      });
    }
  }

  private async getNotificationForViewer(
    userId: string,
    notificationId: string,
  ) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  private async getPreferenceRecordForUser(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      },
    });
  }

  // Preferences are created lazily so existing seeded users keep working even
  // before an explicit preference row has been written for them.
  private async getPreferenceRecordsForUsers(userIds: string[]) {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    });
    const existingIds = new Set(
      preferences.map((preference) => preference.userId),
    );
    const missingUserIds = userIds.filter((userId) => !existingIds.has(userId));

    if (missingUserIds.length > 0) {
      await this.prisma.notificationPreference.createMany({
        data: missingUserIds.map((userId) => ({
          userId,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
        })),
        skipDuplicates: true,
      });
    }

    const allPreferences =
      missingUserIds.length > 0
        ? await this.prisma.notificationPreference.findMany({
            where: { userId: { in: userIds } },
          })
        : preferences;

    return new Map(
      allPreferences.map((preference) => [preference.userId, preference]),
    );
  }

  private toNotificationResponse(
    notification: Notification,
  ): NotificationResponse {
    const createdAtUtc = notification.createdAtUtc.toISOString();

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: Boolean(notification.readAtUtc),
      createdAtUtc,
      createdAtLabel:
        DateTime.fromISO(createdAtUtc, {
          zone: 'utc',
        }).toRelative() ?? 'Just now',
    };
  }

  private toPreferencesResponse(
    preference: NotificationPreference,
  ): NotificationPreferencesResponse {
    return {
      scheduleUpdates: preference.scheduleUpdates,
      coverageUpdates: preference.coverageUpdates,
      overtimeWarnings: preference.overtimeWarnings,
      availabilityUpdates: preference.availabilityUpdates,
    };
  }

  private isTypeEnabled(
    preference: NotificationPreference,
    type: NotificationType,
  ) {
    switch (type) {
      case 'shift_assigned':
      case 'shift_changed':
      case 'schedule_published':
        return preference.scheduleUpdates;
      case 'coverage_request':
      case 'coverage_resolved':
        return preference.coverageUpdates;
      case 'overtime_warning':
        return preference.overtimeWarnings;
      case 'availability_changed':
        return preference.availabilityUpdates;
      default:
        return true;
    }
  }
}
