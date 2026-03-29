import type { UserRole } from "@/types";

export type ShiftState =
  | "scheduled"
  | "open"
  | "warning"
  | "blocked"
  | "pending";

export type AssignmentOptionStatus =
  | "assigned"
  | "available"
  | "warning"
  | "blocked";

export type CoverageRequestType = "swap" | "drop";

export type CoverageRequestStatus =
  | "pending_counterparty"
  | "pending_manager"
  | "open"
  | "approved"
  | "cancelled"
  | "expired";

export type StaffSummaryResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ScheduleLocationResponse = {
  id: string;
  name: string;
  code: string;
  timeZone: string;
  timeZoneLabel: string;
  city: string;
  region: string;
  country: string;
  addressLine: string;
  latitude: number;
  longitude: number;
};

export type ScheduleStaffResponse = StaffSummaryResponse & {
  skills: string[];
  certifiedLocationIds: string[];
  availabilitySummary: string;
  desiredHours: number;
};

export type AssignmentOptionResponse = {
  staff: ScheduleStaffResponse;
  status: AssignmentOptionStatus;
  message?: string;
  suggestions?: StaffSummaryResponse[];
  warningMessages?: string[];
  projectedWeeklyHours?: number;
};

export type ShiftResponse = {
  id: string;
  title: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  startsAtUtc: string;
  endsAtUtc: string;
  startsAtLocal: string;
  endsAtLocal: string;
  location: ScheduleLocationResponse;
  requiredSkill: string;
  headcount: number;
  assignees: StaffSummaryResponse[];
  openSlots: number;
  premium: boolean;
  published: boolean;
  canEdit: boolean;
  state: ShiftState;
  note: string;
  explanation?: string;
  projectedImpact?: string;
  suggestions?: StaffSummaryResponse[];
  warningMessages: string[];
  assignmentOptions: AssignmentOptionResponse[];
  auditCount: number;
};

export type PublishBlockerResponse = {
  id: string;
  title: string;
  state: ShiftState;
  locationCode: string;
  timeLabel: string;
  reason: string;
};

export type SchedulingBoardResponse = {
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  publishCutoffHours: number;
  locations: ScheduleLocationResponse[];
  staffDirectory: ScheduleStaffResponse[];
  skills: string[];
  shifts: ShiftResponse[];
  summary: {
    totalShiftCount: number;
    openShiftCount: number;
    riskShiftCount: number;
    premiumShiftCount: number;
    publishedShiftCount: number;
  };
  publishBlockers: PublishBlockerResponse[];
};

export type CoverageRequestStep = {
  label: string;
  status: "done" | "current" | "upcoming";
};

export type CoverageRequestResponse = {
  id: string;
  type: CoverageRequestType;
  status: CoverageRequestStatus;
  statusLabel: string;
  expiresInLabel: string;
  note: string;
  shift: {
    id: string;
    title: string;
    dateLabel: string;
    timeLabel: string;
    locationName: string;
    locationCode: string;
    timeZoneLabel: string;
  };
  requestedBy: StaffSummaryResponse;
  counterpart?: StaffSummaryResponse;
  claimant?: StaffSummaryResponse;
  suggestedClaimants: StaffSummaryResponse[];
  steps: CoverageRequestStep[];
  originalAssignmentRemains: boolean;
};

export type CoverageBoardResponse = {
  requests: CoverageRequestResponse[];
  summary: {
    totalRequests: number;
    managerActionCount: number;
    dropRequestCount: number;
    swapRequestCount: number;
  };
};

export type ShiftMutationPayload = {
  title?: string;
  locationId: string;
  startsAtLocal: string;
  endsAtLocal: string;
  requiredSkill: string;
  headcount: number;
};

export type ShiftAssignmentPayload = {
  shiftId: string;
  staffId: string;
};

export type ShiftAssigneeRemovalPayload = {
  shiftId: string;
  staffId: string;
};

export type CoverageActionResponse = {
  success: true;
  request: CoverageRequestResponse;
};
