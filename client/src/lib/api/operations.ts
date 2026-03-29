import { apiClient } from "@/lib/api/client";
import type {
  FairnessReportResponse,
  OnDutyLocationResponse,
  OperationsDashboardResponse,
} from "@/types/operations";

export const operationsQueryKeys = {
  dashboard: (weekStartDate: string) =>
    ["operations", "dashboard", weekStartDate] as const,
  fairness: (startDate: string, endDate: string) =>
    ["operations", "fairness", startDate, endDate] as const,
  onDutyNow: ["operations", "on-duty-now"] as const,
};

export const getOperationsDashboard = async (weekStartDate: string) => {
  const { data } = await apiClient.get<OperationsDashboardResponse>(
    "/operations/dashboard",
    {
      params: { weekStart: weekStartDate },
    },
  );

  return data;
};

export const getFairnessReport = async (
  startDate: string,
  endDate: string,
) => {
  const { data } = await apiClient.get<FairnessReportResponse>(
    "/operations/fairness",
    {
      params: { startDate, endDate },
    },
  );

  return data;
};

export const getOnDutyNow = async () => {
  const { data } = await apiClient.get<OnDutyLocationResponse[]>(
    "/operations/on-duty-now",
  );

  return data;
};
