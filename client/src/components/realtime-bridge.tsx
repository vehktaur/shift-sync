"use client";

import { useRealtimeEvents } from "@/hooks/use-realtime-events";

export function RealtimeBridge() {
  useRealtimeEvents();
  return null;
}
