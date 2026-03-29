export type RealtimeEventTopic =
  | "schedule.updated"
  | "coverage.updated"
  | "notifications.updated"
  | "dashboard.updated"
  | "heartbeat";

export type RealtimeEventResponse = {
  id: string;
  topic: RealtimeEventTopic;
  createdAtUtc: string;
  payload?: {
    shiftId?: string;
    requestId?: string;
    locationIds?: string[];
    notificationIds?: string[];
  };
};
