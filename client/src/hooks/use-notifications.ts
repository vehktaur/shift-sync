"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getNotificationCenter,
  getNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  notificationQueryKeys,
  updateNotificationPreferences,
} from "@/lib/api/notifications";
import { getApiErrorMessage } from "@/lib/api/client";

const NOTIFICATIONS_REFRESH_INTERVAL_MS = 20_000;

export const useNotificationCenter = () =>
  useQuery({
    queryKey: notificationQueryKeys.center,
    queryFn: getNotificationCenter,
    refetchInterval: NOTIFICATIONS_REFRESH_INTERVAL_MS,
  });

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: notificationQueryKeys.preferences,
    queryFn: getNotificationPreferences,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.center,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to mark notification."));
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.center,
      });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Unable to update notifications."),
      );
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.preferences,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.center,
        }),
      ]);
      toast.success("Notification preferences updated.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save preferences."));
    },
  });
};
