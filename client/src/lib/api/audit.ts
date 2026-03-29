import { apiClient } from "@/lib/api/client";
import type {
  AuditExportResponse,
  ShiftAuditHistoryResponse,
} from "@/types/audit";

export const auditQueryKeys = {
  shiftHistory: (shiftId: string) => ["audit", "shift", shiftId] as const,
  export: (startDate: string, endDate: string, locationId?: string) =>
    ["audit", "export", startDate, endDate, locationId ?? "all"] as const,
};

export const getShiftAuditHistory = async (shiftId: string) => {
  const { data } = await apiClient.get<ShiftAuditHistoryResponse>(
    `/audit/shifts/${shiftId}`,
  );

  return data;
};

export const getAuditExport = async (params: {
  startDate: string;
  endDate: string;
  locationId?: string;
}) => {
  const { data } = await apiClient.get<AuditExportResponse>("/audit/export", {
    params,
  });

  return data;
};
