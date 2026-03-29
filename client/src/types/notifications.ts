export type NotificationType =
  | "shift_assigned"
  | "shift_changed"
  | "schedule_published"
  | "coverage_request"
  | "coverage_resolved"
  | "overtime_warning"
  | "availability_changed";

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAtUtc: string;
  createdAtLabel: string;
};

export type NotificationCenterResponse = {
  unreadCount: number;
  notifications: NotificationResponse[];
};

export type NotificationPreferencesResponse = {
  scheduleUpdates: boolean;
  coverageUpdates: boolean;
  overtimeWarnings: boolean;
  availabilityUpdates: boolean;
};

export type NotificationPreferencesPayload = Partial<NotificationPreferencesResponse>;
