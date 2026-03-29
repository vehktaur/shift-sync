import { DateTime } from 'luxon';

import { getAllUsers } from '../auth/mock-users';
import type {
  NotificationPreferenceRecord,
  NotificationRecord,
} from '../scheduling/scheduling.types';

type NotificationsStore = {
  notifications: NotificationRecord[];
  preferences: NotificationPreferenceRecord[];
};

const buildDefaultPreference = (
  userId: string,
): NotificationPreferenceRecord => ({
  userId,
  scheduleUpdates: true,
  coverageUpdates: true,
  overtimeWarnings: true,
  availabilityUpdates: true,
});

const now = DateTime.utc();

export const notificationsStore: NotificationsStore = {
  notifications: [
    {
      id: crypto.randomUUID(),
      userId: 'usr_mgr_lauren',
      type: 'overtime_warning',
      title: 'Overtime risk on Boardwalk',
      body: 'Olivia Brooks is trending above 35 hours this week if Wednesday stays assigned.',
      createdAtUtc: now.minus({ hours: 3 }).toISO() ?? '',
    },
    {
      id: crypto.randomUUID(),
      userId: 'usr_mgr_maya',
      type: 'coverage_request',
      title: 'Coverage request needs approval',
      body: 'A drop request for Friday Closing Bar is waiting on manager approval.',
      createdAtUtc: now.minus({ hours: 2 }).toISO() ?? '',
    },
    {
      id: crypto.randomUUID(),
      userId: 'usr_staff_maria',
      type: 'shift_changed',
      title: 'Shift updated',
      body: 'Lunch Service at Boardwalk Kitchen was updated and is still inside the editable window.',
      createdAtUtc: now.minus({ hours: 6 }).toISO() ?? '',
      readAtUtc: now.minus({ hours: 1 }).toISO() ?? '',
    },
  ],
  preferences: getAllUsers().map((user) => buildDefaultPreference(user.id)),
};
