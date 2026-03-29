"use client";

import { useQuery } from "@tanstack/react-query";

import {
  auditQueryKeys,
  getAuditExport,
  getShiftAuditHistory,
} from "@/lib/api/audit";

export const useShiftAuditHistory = (shiftId: string | null) =>
  useQuery({
    queryKey: shiftId ? auditQueryKeys.shiftHistory(shiftId) : ["audit", "idle"],
    queryFn: async () => {
      if (!shiftId) {
        return null;
      }

      return getShiftAuditHistory(shiftId);
    },
    enabled: Boolean(shiftId),
  });

export const useAuditExport = ({
  startDate,
  endDate,
  locationId,
  enabled = true,
}: {
  startDate: string;
  endDate: string;
  locationId?: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: auditQueryKeys.export(startDate, endDate, locationId),
    queryFn: async () => getAuditExport({ startDate, endDate, locationId }),
    enabled,
  });
