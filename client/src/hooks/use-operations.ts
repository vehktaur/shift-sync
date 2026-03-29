"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getFairnessReport,
  getOnDutyNow,
  getOperationsDashboard,
  operationsQueryKeys,
} from "@/lib/api/operations";

const OPERATIONS_REFRESH_INTERVAL_MS = 60_000;

export const useOperationsDashboard = (weekStartDate: string) =>
  useQuery({
    queryKey: operationsQueryKeys.dashboard(weekStartDate),
    queryFn: async () => getOperationsDashboard(weekStartDate),
    refetchInterval: OPERATIONS_REFRESH_INTERVAL_MS,
  });

export const useFairnessReport = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: operationsQueryKeys.fairness(startDate, endDate),
    queryFn: async () => getFairnessReport(startDate, endDate),
    refetchInterval: OPERATIONS_REFRESH_INTERVAL_MS,
  });

export const useOnDutyNow = () =>
  useQuery({
    queryKey: operationsQueryKeys.onDutyNow,
    queryFn: getOnDutyNow,
    refetchInterval: OPERATIONS_REFRESH_INTERVAL_MS,
  });
