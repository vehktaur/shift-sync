"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getApiBaseUrl } from "@/lib/api/base-url";
import { notificationQueryKeys } from "@/lib/api/notifications";
import { schedulingQueryKeys } from "@/lib/api/scheduling";
import type { RealtimeEventResponse } from "@/types/realtime";

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource(`${getApiBaseUrl()}/events/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RealtimeEventResponse;

      switch (payload.topic) {
        case "schedule.updated":
          void queryClient.invalidateQueries({
            queryKey: ["scheduling", "board"],
          });
          if (payload.payload?.shiftId) {
            void queryClient.invalidateQueries({
              queryKey: schedulingQueryKeys.eligibleStaff(payload.payload.shiftId),
            });
          }
          break;
        case "coverage.updated":
          void queryClient.invalidateQueries({
            queryKey: schedulingQueryKeys.coverageBoard,
          });
          break;
        case "notifications.updated":
          void queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.center,
          });
          break;
        case "dashboard.updated":
        case "heartbeat":
          void queryClient.invalidateQueries({
            queryKey: ["operations"],
          });
          break;
        default:
          break;
      }
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
};
