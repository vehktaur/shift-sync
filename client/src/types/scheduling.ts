import type { UserRole } from "@/types";

export type ShiftState =
  | "scheduled"
  | "open"
  | "warning"
  | "blocked"
  | "pending";

export type CoverageRequestType = "swap" | "drop";

export type CoverageRequestStatus =
  | "pending_counterparty"
  | "pending_manager"
  | "open"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type CoverageRequestAction =
  | "approve"
  | "cancel"
  | "accept"
  | "reject"
  | "claim"
  | "withdraw";

export type CoverageRequestViewerRelation =
  | "requester"
  | "counterpart"
  | "claimant"
  | "manager"
  | "eligible_claimant"
  | "observer";

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

export type EligibleStaffResponse = {
  staff: ScheduleStaffResponse;
  warningMessages: string[];
  projectedWeeklyHours?: number;
};

export type AssignmentViolationRule =
  | "assignment_constraint"
  | "required_skill"
  | "location_certification"
  | "availability_window"
  | "no_overlapping_shifts"
  | "minimum_rest_between_shifts"
  | "daily_hours_hard_block"
  | "seventh_consecutive_day_override_required"
  | "required_headcount";

export type AssignmentViolationResponse = {
  code: string;
  message: string;
  violatedRule: AssignmentViolationRule;
  suggestedStaff: StaffSummaryResponse[];
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
  statusSummary: string;
  suggestions?: StaffSummaryResponse[];
  warningMessages: string[];
  auditCount: number;
};

export type SchedulingBoardResponse = {
  weekStartDate: string;
  weekEndDate: string;
  shifts: ShiftResponse[];
};

export type ShiftReferenceDataResponse = {
  skills: string[];
};

export type CoverageRequestStep = {
  label: string;
  status: "done" | "current" | "upcoming";
};

export type CoverageRequestResponse = {
  id: string;
  type: CoverageRequestType;
  status: CoverageRequestStatus;
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
  viewerRelation: CoverageRequestViewerRelation;
  availableActions: CoverageRequestAction[];
};

export type CoverageBoardResponse = {
  requests: CoverageRequestResponse[];
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
  overrideReason?: string;
};

export type ShiftAssigneeRemovalPayload = {
  shiftId: string;
  staffId: string;
};

export type CoverageActionResponse = {
  success: true;
  request: CoverageRequestResponse;
};

export type CoverageRequestMutationPayload = {
  shiftId: string;
  counterpartUserId?: string;
  note?: string;
};

export type CoverageRequestOptionsResponse = {
  shiftId: string;
  shiftTitle: string;
  requester: StaffSummaryResponse;
  eligibleSwapTargets: StaffSummaryResponse[];
  eligibleDropClaimants: StaffSummaryResponse[];
};
