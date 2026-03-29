import type { ScheduleLocationResponse, ScheduleStaffResponse, StaffSummaryResponse } from "@/types/scheduling";

export type DashboardMetricTone = "default" | "warning" | "critical" | "success";

export type DashboardMetricResponse = {
  label: string;
  value: string;
  description: string;
  tone: DashboardMetricTone;
};

export type OvertimeAssignmentResponse = {
  shiftId: string;
  shiftTitle: string;
  staff: StaffSummaryResponse;
  location: {
    id: string;
    name: string;
  };
  timeLabel: string;
  overtimeHoursAdded: number;
  overtimePremiumCost: number;
};

export type LaborAlertResponse = {
  id: string;
  severity: "warning" | "critical";
  message: string;
  shiftTitle: string;
  locationCode: string;
  staff: StaffSummaryResponse;
};

export type OnDutyLocationResponse = {
  location: ScheduleLocationResponse;
  activeAssignments: StaffSummaryResponse[];
  status: "live" | "upcoming" | "quiet";
  nextShiftTimeLabel?: string;
};

export type FairnessStaffReportResponse = {
  staff: ScheduleStaffResponse;
  assignedHours: number;
  targetHoursForPeriod: number;
  desiredHoursDelta: number;
  premiumShiftCount: number;
  pendingCoverageRequests: number;
  status: "under" | "balanced" | "over";
  note: string;
};

export type FairnessReportResponse = {
  periodStartDate: string;
  periodEndDate: string;
  fairnessScore: number;
  premiumShiftCount: number;
  underScheduledCount: number;
  overScheduledCount: number;
  balancedCount: number;
  teamMembers: FairnessStaffReportResponse[];
};

export type OperationsDashboardResponse = {
  weekStartDate: string;
  weekEndDate: string;
  metrics: DashboardMetricResponse[];
  projectedOvertimePremiumCost: number;
  overtimeAssignments: OvertimeAssignmentResponse[];
  laborAlerts: LaborAlertResponse[];
  fairness: FairnessReportResponse;
  onDutyLocations: OnDutyLocationResponse[];
};
