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
  latitude: number;
  longitude: number;
};

export type ShiftState =
  | 'scheduled'
  | 'open'
  | 'warning'
  | 'blocked'
  | 'pending';

export type ShiftAuditRecord = {
  id: string;
  action:
    | 'shift.created'
    | 'shift.updated'
    | 'shift.published'
    | 'shift.unpublished'
    | 'shift.assignee_added'
    | 'shift.assignee_removed'
    | 'coverage.created'
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
  auditTrail: ShiftAuditRecord[];
};

export type CoverageRequestType = 'swap' | 'drop';

export type CoverageRequestStatus =
  | 'pending_counterparty'
  | 'pending_manager'
  | 'open'
  | 'approved'
  | 'rejected'
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

export type CoverageRequestViewerRelation =
  | 'requester'
  | 'counterpart'
  | 'claimant'
  | 'manager'
  | 'eligible_claimant'
  | 'observer';

export type CoverageRequestAction =
  | 'approve'
  | 'cancel'
  | 'accept'
  | 'reject'
  | 'claim'
  | 'withdraw';

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
  status: 'done' | 'current' | 'upcoming';
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
  overrideReason?: string;
};

export type CoverageActionResponse = {
  success: true;
  request: CoverageRequestResponse;
};

export type ShiftDeletionResponse = {
  success: true;
};

export type CoverageRequestMutationBody = {
  shiftId?: string;
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

export type DashboardMetricTone =
  | 'default'
  | 'warning'
  | 'critical'
  | 'success';

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

export type LaborAlertSeverity = 'warning' | 'critical';

export type LaborAlertResponse = {
  id: string;
  severity: LaborAlertSeverity;
  message: string;
  shiftTitle: string;
  locationCode: string;
  staff: StaffSummaryResponse;
};

export type OnDutyLocationResponse = {
  location: ScheduleLocationResponse;
  activeAssignments: StaffSummaryResponse[];
  status: 'live' | 'upcoming' | 'quiet';
  nextShiftTimeLabel?: string;
};

export type FairnessStaffReportResponse = {
  staff: ScheduleStaffResponse;
  assignedHours: number;
  targetHoursForPeriod: number;
  desiredHoursDelta: number;
  premiumShiftCount: number;
  pendingCoverageRequests: number;
  status: 'under' | 'balanced' | 'over';
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

export type NotificationType =
  | 'shift_assigned'
  | 'shift_changed'
  | 'schedule_published'
  | 'coverage_request'
  | 'coverage_resolved'
  | 'overtime_warning'
  | 'availability_changed';

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAtUtc: string;
  createdAtLabel: string;
};

export type NotificationCenterResponse = {
  unreadCount: number;
  notifications: NotificationResponse[];
};

export type NotificationPreferencesResponse = {
  scheduleUpdates: boolean;
  coverageUpdates: boolean;
  overtimeWarnings: boolean;
  availabilityUpdates: boolean;
};

export type NotificationPreferencesUpdateBody = {
  scheduleUpdates?: boolean;
  coverageUpdates?: boolean;
  overtimeWarnings?: boolean;
  availabilityUpdates?: boolean;
};

export type ShiftAuditHistoryResponse = {
  shiftId: string;
  shiftTitle: string;
  location: ScheduleLocationResponse;
  entries: ShiftAuditRecord[];
};

export type AuditExportEntryResponse = ShiftAuditRecord & {
  shiftId: string;
  shiftTitle: string;
  locationId: string;
  locationName: string;
};

export type AuditExportResponse = {
  filters: {
    startDate: string;
    endDate: string;
    locationId?: string;
  };
  entries: AuditExportEntryResponse[];
};

export type RealtimeEventTopic =
  | 'schedule.updated'
  | 'coverage.updated'
  | 'notifications.updated'
  | 'dashboard.updated'
  | 'heartbeat';

export type RealtimeEventPayload = {
  shiftId?: string;
  requestId?: string;
  locationIds?: string[];
  notificationIds?: string[];
};

export type RealtimeEventResponse = {
  id: string;
  topic: RealtimeEventTopic;
  createdAtUtc: string;
  payload?: RealtimeEventPayload;
};

export type AssignmentViolationRule =
  | 'assignment_constraint'
  | 'required_skill'
  | 'location_certification'
  | 'availability_window'
  | 'no_overlapping_shifts'
  | 'minimum_rest_between_shifts'
  | 'daily_hours_hard_block'
  | 'seventh_consecutive_day_override_required'
  | 'required_headcount';

export type AssignmentViolationResponse = {
  code: string;
  message: string;
  violatedRule: AssignmentViolationRule;
  suggestedStaff: StaffSummaryResponse[];
};

export type SchedulingViewer = SessionUser & {
  record: User;
};
