import type { SessionUser, User } from '../auth/auth.types';

export type LocationRecord = {
  id: string;
  name: string;
  code: string;
  timeZone: string;
  timeZoneLabel: string;
  city: string;
  region: string;
  country: string;
  addressLine: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
};

export type ShiftState =
  | 'scheduled'
  | 'open'
  | 'warning'
  | 'blocked'
  | 'pending';

export type ShiftSeedContext = {
  state?: Extract<ShiftState, 'warning' | 'blocked' | 'pending'>;
  note?: string;
  explanation?: string;
  projectedImpact?: string;
  suggestions?: string[];
};

export type ShiftAuditRecord = {
  id: string;
  action:
    | 'shift.created'
    | 'shift.updated'
    | 'shift.published'
    | 'shift.unpublished'
    | 'shift.assignee_added'
    | 'shift.assignee_removed'
    | 'coverage.approved'
    | 'coverage.cancelled';
  actorUserId: string;
  actorName: string;
  atUtc: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export type ShiftRecord = {
  id: string;
  title: string;
  locationId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  requiredSkill: string;
  headcount: number;
  assigneeIds: string[];
  published: boolean;
  premium: boolean;
  createdByUserId: string;
  updatedByUserId: string;
  updatedAtUtc: string;
  cutoffHours: number;
  forceCutoffPassed?: boolean;
  seedContext?: ShiftSeedContext;
  auditTrail: ShiftAuditRecord[];
};

export type CoverageRequestType = 'swap' | 'drop';

export type CoverageRequestStatus =
  | 'pending_counterparty'
  | 'pending_manager'
  | 'open'
  | 'approved'
  | 'cancelled'
  | 'expired';

export type CoverageRequestRecord = {
  id: string;
  type: CoverageRequestType;
  shiftId: string;
  requestedByUserId: string;
  counterpartUserId?: string;
  claimantUserId?: string;
  status: CoverageRequestStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  expiresAtUtc: string;
  note: string;
  cancellationReason?: string;
};

export type AssignmentOptionStatus =
  | 'assigned'
  | 'available'
  | 'warning'
  | 'blocked';

export type StaffSummaryResponse = {
  id: string;
  name: string;
  email: string;
  role: User['role'];
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
  mapUrl: string;
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
  status: 'done' | 'current' | 'upcoming';
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
    mapUrl: string;
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

export type ShiftMutationRequestBody = {
  title?: string;
  locationId?: string;
  startsAtLocal?: string;
  endsAtLocal?: string;
  requiredSkill?: string;
  headcount?: number;
};

export type ShiftAssignmentRequestBody = {
  staffId?: string;
};

export type CoverageActionResponse = {
  success: true;
  request: CoverageRequestResponse;
};

export type SchedulingViewer = SessionUser & {
  record: User;
};
