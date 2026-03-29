import { apiClient } from "@/lib/api/client";
import type {
  NotificationCenterResponse,
  NotificationPreferencesPayload,
  NotificationPreferencesResponse,
  NotificationResponse,
} from "@/types/notifications";

export const notificationQueryKeys = {
  center: ["notifications", "center"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export const getNotificationCenter = async () => {
  const { data } =
    await apiClient.get<NotificationCenterResponse>("/notifications");

  return data;
};

export const getNotificationPreferences = async () => {
  const { data } = await apiClient.get<NotificationPreferencesResponse>(
    "/notifications/preferences",
  );

  return data;
};

export const markNotificationRead = async (notificationId: string) => {
  const { data } = await apiClient.patch<NotificationResponse>(
    `/notifications/${notificationId}/read`,
  );

  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.post<NotificationCenterResponse>(
    "/notifications/actions/read-all",
  );

  return data;
};

export const updateNotificationPreferences = async (
  payload: NotificationPreferencesPayload,
) => {
  const { data } = await apiClient.patch<NotificationPreferencesResponse>(
    "/notifications/preferences",
    payload,
  );

  return data;
};
