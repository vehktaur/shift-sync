import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';

import { getAllUsers, getUserById } from '../auth/mock-users';
import type { SessionUser, User } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  DEFAULT_CUTOFF_HOURS,
  OVERTIME_PREMIUM_RATE,
  SHIFT_SKILLS,
} from './scheduling.constants';
import { schedulingStore } from './scheduling.data';
import type {
  AuditExportEntryResponse,
  AuditExportResponse,
  AssignmentViolationResponse,
  AssignmentViolationRule,
  CoverageActionResponse,
  CoverageBoardResponse,
  CoverageRequestAction,
  CoverageRequestRecord,
  CoverageRequestMutationBody,
  CoverageRequestOptionsResponse,
  CoverageRequestResponse,
  CoverageRequestStep,
  CoverageRequestType,
  CoverageRequestViewerRelation,
  DashboardMetricResponse,
  EligibleStaffResponse,
  FairnessReportResponse,
  FairnessStaffReportResponse,
  LaborAlertResponse,
  LocationRecord,
  NotificationType,
  OnDutyLocationResponse,
  OperationsDashboardResponse,
  OvertimeAssignmentResponse,
  ScheduleLocationResponse,
  ScheduleStaffResponse,
  SchedulingBoardResponse,
  SchedulingViewer,
  ShiftReferenceDataResponse,
  ShiftAuditHistoryResponse,
  ShiftAuditRecord,
  ShiftMutationRequestBody,
  ShiftRecord,
  ShiftResponse,
  ShiftState,
  StaffSummaryResponse,
} from './scheduling.types';

type StaffRecord = Extract<User, { role: 'staff' }>;

type AssignmentEvaluation = {
  status: 'available' | 'warning' | 'blocked';
  code?: string;
  message?: string;
  violatedRule?: AssignmentViolationRule;
  warnings: string[];
  suggestedStaff?: StaffSummaryResponse[];
  projectedWeeklyHours?: number;
};

const isStaffRecord = (user: User): user is StaffRecord =>
  user.role === 'staff';

const overlaps = (
  leftStart: DateTime,
  leftEnd: DateTime,
  rightStart: DateTime,
  rightEnd: DateTime,
) => leftStart < rightEnd && rightStart < leftEnd;

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const getDayOfWeekKey = (date: DateTime) =>
  date.toFormat('cccc').toLowerCase() as
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

const buildStaffSummary = (staff: User): StaffSummaryResponse => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  role: staff.role,
});

const formatHours = (hours: number) => Math.round(hours * 10) / 10;

@Injectable()
export class SchedulingService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  getLocations(viewer: SessionUser): ScheduleLocationResponse[] {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    return this.getVisibleLocationsForViewer(schedulingViewer.record).map(
      (location) => this.toLocationResponse(location),
    );
  }

  getSchedulingBoard(
    viewer: SessionUser,
    requestedWeekStartDate?: string,
  ): SchedulingBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.expireCoverageRequests();
    const boardWeek = this.resolveBoardWeek(requestedWeekStartDate);

    // Keep the board payload limited to week-variant schedule data. Stable
    // reference data such as locations and skills are fetched separately.
    const visibleShifts = this.getVisibleShiftsForWeek(
      schedulingViewer.record,
      boardWeek,
    );
    const shiftResponses = visibleShifts
      .map((shift) => this.buildShiftResponse(shift))
      .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc));
    return {
      weekStartDate: boardWeek.weekStartDate,
      weekEndDate: boardWeek.weekEndDate,
      shifts: shiftResponses,
    };
  }

  getShiftReferenceData(): ShiftReferenceDataResponse {
    return {
      skills: [...SHIFT_SKILLS],
    };
  }

  getOperationsDashboard(
    viewer: SessionUser,
    requestedWeekStartDate?: string,
  ): OperationsDashboardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const boardWeek = this.resolveBoardWeek(requestedWeekStartDate);
    const visibleShifts = this.getVisibleShiftsForWeek(
      schedulingViewer.record,
      boardWeek,
    );
    const fairness = this.getFairnessReport(
      viewer,
      boardWeek.weekStartDate,
      boardWeek.weekEndDate,
    );
    const overtimeAssignments =
      this.getProjectedOvertimeAssignments(visibleShifts);
    const laborAlerts = this.getLaborAlerts(visibleShifts);
    const projectedOvertimePremiumCost = formatHours(
      overtimeAssignments.reduce(
        (total, assignment) => total + assignment.overtimePremiumCost,
        0,
      ),
    );

    return {
      weekStartDate: boardWeek.weekStartDate,
      weekEndDate: boardWeek.weekEndDate,
      metrics: [
        this.buildDashboardMetric(
          'Projected premium',
          `$${projectedOvertimePremiumCost.toFixed(2)}`,
          overtimeAssignments.length > 0
            ? `${overtimeAssignments.length} assignment${overtimeAssignments.length === 1 ? '' : 's'} are driving overtime right now.`
            : 'No projected overtime premium in the visible week.',
          overtimeAssignments.length > 0 ? 'warning' : 'success',
        ),
        this.buildDashboardMetric(
          'Compliance alerts',
          String(laborAlerts.length),
          laborAlerts.length > 0
            ? 'Warnings are active across daily hours, weekly hours, or consecutive-day limits.'
            : 'No active compliance alerts in the visible week.',
          laborAlerts.some((alert) => alert.severity === 'critical')
            ? 'critical'
            : laborAlerts.length > 0
              ? 'warning'
              : 'success',
        ),
        this.buildDashboardMetric(
          'Fairness score',
          `${fairness.fairnessScore}`,
          `${fairness.underScheduledCount} under target, ${fairness.overScheduledCount} over target.`,
          fairness.fairnessScore >= 80
            ? 'success'
            : fairness.fairnessScore >= 60
              ? 'warning'
              : 'critical',
        ),
        this.buildDashboardMetric(
          'Premium assignments',
          String(fairness.premiumShiftCount),
          'Friday and Saturday evening assignments in the selected week.',
          'default',
        ),
      ],
      projectedOvertimePremiumCost,
      overtimeAssignments,
      laborAlerts,
      fairness,
      onDutyLocations: this.getOnDutyNow(viewer),
    };
  }

  getFairnessReport(
    viewer: SessionUser,
    requestedStartDate?: string,
    requestedEndDate?: string,
  ): FairnessReportResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const period = this.resolveDateRange(requestedStartDate, requestedEndDate);
    const visibleStaff = this.getVisibleStaffForViewer(schedulingViewer.record);
    const visibleShifts = this.getVisibleShiftsForViewer(
      schedulingViewer.record,
    );
    const teamMembers = visibleStaff
      .map((staff) =>
        this.buildFairnessStaffReport(staff, visibleShifts, period),
      )
      .sort((left, right) => left.staff.name.localeCompare(right.staff.name));
    const premiumAssignments = teamMembers.reduce(
      (total, member) => total + member.premiumShiftCount,
      0,
    );
    const fairnessScore = this.calculateFairnessScore(teamMembers);

    return {
      periodStartDate: period.startDate,
      periodEndDate: period.endDate,
      fairnessScore,
      premiumShiftCount: premiumAssignments,
      underScheduledCount: teamMembers.filter(
        (member) => member.status === 'under',
      ).length,
      overScheduledCount: teamMembers.filter(
        (member) => member.status === 'over',
      ).length,
      balancedCount: teamMembers.filter(
        (member) => member.status === 'balanced',
      ).length,
      teamMembers,
    };
  }

  getOnDutyNow(viewer: SessionUser, atUtc?: string): OnDutyLocationResponse[] {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const instant = atUtc
      ? DateTime.fromISO(atUtc, { zone: 'utc' })
      : DateTime.utc();

    if (!instant.isValid) {
      throw new BadRequestException('atUtc must be a valid ISO datetime.');
    }

    return this.getVisibleLocationsForViewer(schedulingViewer.record)
      .map((location) => {
        const activeShifts = this.getVisibleShiftsForViewer(
          schedulingViewer.record,
        ).filter((shift) => {
          if (shift.locationId !== location.id) {
            return false;
          }

          const startsAt = DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' });
          const endsAt = DateTime.fromISO(shift.endsAtUtc, { zone: 'utc' });
          return startsAt <= instant && instant < endsAt;
        });
        const activeAssignments = activeShifts.flatMap((shift) =>
          shift.assigneeIds
            .map((staffId) => this.getStaffOrNull(staffId))
            .filter((staff): staff is StaffRecord => Boolean(staff))
            .map((staff) => buildStaffSummary(staff)),
        );
        const nextShift = this.getVisibleShiftsForViewer(
          schedulingViewer.record,
        )
          .filter((shift) => shift.locationId === location.id)
          .filter(
            (shift) =>
              DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' }) > instant,
          )
          .sort((left, right) =>
            left.startsAtUtc.localeCompare(right.startsAtUtc),
          )[0];

        return {
          location: this.toLocationResponse(location),
          activeAssignments,
          status:
            activeShifts.length > 0 ? 'live' : nextShift ? 'upcoming' : 'quiet',
          nextShiftTimeLabel: nextShift
            ? this.getShiftStartLocal(nextShift, location).toFormat(
                'EEE h:mm a',
              )
            : undefined,
        } satisfies OnDutyLocationResponse;
      })
      .sort((left, right) =>
        left.location.name.localeCompare(right.location.name),
      );
  }

  getShiftAuditHistory(
    viewer: SessionUser,
    shiftId: string,
  ): ShiftAuditHistoryResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    const location = this.getLocationById(shift.locationId);

    return {
      shiftId: shift.id,
      shiftTitle: shift.title,
      location: this.toLocationResponse(location),
      entries: [...shift.auditTrail].sort((left, right) =>
        right.atUtc.localeCompare(left.atUtc),
      ),
    };
  }

  exportAuditLog(
    viewer: SessionUser,
    requestedStartDate?: string,
    requestedEndDate?: string,
    locationId?: string,
  ): AuditExportResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const period = this.resolveDateRange(requestedStartDate, requestedEndDate);
    const entries = this.getVisibleShiftsForViewer(schedulingViewer.record)
      .filter((shift) => !locationId || shift.locationId === locationId)
      .flatMap((shift) => {
        const location = this.getLocationById(shift.locationId);
        return shift.auditTrail
          .filter((entry) => this.isAuditEntryInsideRange(entry, period))
          .map(
            (entry): AuditExportEntryResponse => ({
              ...entry,
              shiftId: shift.id,
              shiftTitle: shift.title,
              locationId: location.id,
              locationName: location.name,
            }),
          );
      })
      .sort((left, right) => right.atUtc.localeCompare(left.atUtc));

    return {
      filters: {
        startDate: period.startDate,
        endDate: period.endDate,
        locationId,
      },
      entries,
    };
  }

  createShift(
    viewer: SessionUser,
    body: ShiftMutationRequestBody,
  ): ShiftResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const validated = this.validateShiftPayload(body);
    const location = this.getAccessibleLocation(
      validated.locationId,
      schedulingViewer.record,
    );
    const shiftWindow = this.resolveShiftWindow(
      validated.startsAtLocal,
      location,
      validated.endsAtLocal,
    );

    const shift: ShiftRecord = {
      id: crypto.randomUUID(),
      title:
        validated.title ?? `${toTitleCase(validated.requiredSkill)} coverage`,
      locationId: location.id,
      startsAtUtc: shiftWindow.startsAtUtc.toISO() ?? '',
      endsAtUtc: shiftWindow.endsAtUtc.toISO() ?? '',
      requiredSkill: validated.requiredSkill,
      headcount: validated.headcount,
      assigneeIds: [],
      published: false,
      premium: this.isPremiumShift(shiftWindow.startsAtLocal),
      createdByUserId: schedulingViewer.id,
      updatedByUserId: schedulingViewer.id,
      updatedAtUtc: DateTime.utc().toISO() ?? '',
      cutoffHours: DEFAULT_CUTOFF_HOURS,
      auditTrail: [
        this.createAuditEntry(
          schedulingViewer,
          'shift.created',
          'Created shift draft.',
        ),
      ],
    };

    schedulingStore.shifts.push(shift);
    this.emitSchedulingChange({
      locationIds: [location.id],
      shiftId: shift.id,
      notifyDashboard: true,
    });

    return this.buildShiftResponse(shift);
  }

  async updateShift(
    viewer: SessionUser,
    shiftId: string,
    body: ShiftMutationRequestBody,
  ): Promise<ShiftResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    const validated = this.validateShiftPayload(body);
    const location = this.getAccessibleLocation(
      validated.locationId,
      schedulingViewer.record,
    );
    const shiftWindow = this.resolveShiftWindow(
      validated.startsAtLocal,
      location,
      validated.endsAtLocal,
    );

    const before = this.getShiftAuditSnapshot(shift);

    shift.title = validated.title ?? shift.title;
    shift.locationId = location.id;
    shift.startsAtUtc = shiftWindow.startsAtUtc.toISO() ?? '';
    shift.endsAtUtc = shiftWindow.endsAtUtc.toISO() ?? '';
    shift.requiredSkill = validated.requiredSkill;
    shift.headcount = validated.headcount;
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.premium = this.isPremiumShift(shiftWindow.startsAtLocal);
    shift.assigneeIds = shift.assigneeIds.filter((staffId) => {
      const staff = this.getStaffOrNull(staffId);
      if (!staff) {
        return false;
      }

      return (
        this.evaluateStaffForShift(shift, staff, {
          ignoreShiftId: shift.id,
        }).status !== 'blocked'
      );
    });
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.updated',
        'Updated shift details.',
        {
          before,
          after: this.getShiftAuditSnapshot(shift),
        },
      ),
    );

    this.cancelPendingCoverageRequestsForShift(
      shift.id,
      schedulingViewer,
      'Shift edited before approval. Pending coverage request auto-cancelled.',
    );

    await this.notifyShiftMutation({
      shift,
      type: 'shift_changed',
      title: 'Shift updated',
      body: `${shift.title} at ${location.name} was updated.`,
    });
    this.emitSchedulingChange({
      locationIds: [location.id],
      shiftId: shift.id,
      notifyCoverage: true,
      notifyDashboard: true,
    });

    return this.buildShiftResponse(shift);
  }

  async assignStaff(
    viewer: SessionUser,
    shiftId: string,
    staffId: string,
    overrideReason?: string,
  ): Promise<ShiftResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    const normalizedOverrideReason = overrideReason?.trim() ?? '';
    const staff = this.getVisibleStaffForViewer(schedulingViewer.record).find(
      (candidate) => candidate.id === staffId,
    );

    if (!staff) {
      throw new NotFoundException(
        'That staff member is not visible to this viewer.',
      );
    }

    if (shift.assigneeIds.includes(staff.id)) {
      return this.buildShiftResponse(shift);
    }

    if (shift.assigneeIds.length >= shift.headcount) {
      this.throwAssignmentViolation({
        code: 'SHIFT_HEADCOUNT_FILLED',
        message: 'This shift is already filled to headcount.',
        violatedRule: 'required_headcount',
        suggestedStaff: [],
      });
    }

    const evaluation = this.evaluateStaffForShift(shift, staff, {
      ignoreShiftId: shift.id,
    });

    if (evaluation.status === 'blocked') {
      if (
        evaluation.violatedRule ===
          'seventh_consecutive_day_override_required' &&
        normalizedOverrideReason
      ) {
        evaluation.status = 'warning';
        evaluation.warnings = [
          ...evaluation.warnings,
          `Manager override applied for a 7th consecutive day: ${normalizedOverrideReason}`,
        ];
      } else {
        this.throwAssignmentViolation(
          this.toAssignmentViolationResponse(evaluation),
        );
      }
    }

    const before = this.getShiftAuditSnapshot(shift);
    shift.assigneeIds.push(staff.id);
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.assignee_added',
        normalizedOverrideReason
          ? `Assigned ${staff.name} to the shift with a 7th-day override.`
          : `Assigned ${staff.name} to the shift.`,
        {
          before,
          after: this.getShiftAuditSnapshot(shift),
        },
      ),
    );

    const location = this.getLocationById(shift.locationId);
    await this.notificationsService.createNotifications({
      userIds: [staff.id],
      type: 'shift_assigned',
      title: 'New shift assigned',
      body: `${shift.title} at ${location.name} now includes you.`,
    });

    if (evaluation.warnings.length > 0) {
      await this.notificationsService.createNotifications({
        userIds: this.getManagerAndAdminUserIdsForLocation(shift.locationId),
        type: 'overtime_warning',
        title: 'Assignment warning',
        body: evaluation.warnings[0] ?? 'A compliance warning needs review.',
      });
    }

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      notifyCoverage: true,
      notifyDashboard: true,
      userIds: [staff.id],
    });

    return this.buildShiftResponse(shift);
  }

  async removeAssignee(
    viewer: SessionUser,
    shiftId: string,
    staffId: string,
  ): Promise<ShiftResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);

    if (!shift.assigneeIds.includes(staffId)) {
      return this.buildShiftResponse(shift);
    }

    shift.assigneeIds = shift.assigneeIds.filter(
      (assigneeId) => assigneeId !== staffId,
    );
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';

    const staff = this.getStaffOrNull(staffId);
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.assignee_removed',
        `Removed ${staff?.name ?? 'staff member'} from the shift.`,
      ),
    );

    this.cancelPendingCoverageRequestsForShift(
      shift.id,
      schedulingViewer,
      'Shift staffing changed before approval. Pending coverage request auto-cancelled.',
    );

    if (staff) {
      const location = this.getLocationById(shift.locationId);
      await this.notificationsService.createNotifications({
        userIds: [staff.id],
        type: 'shift_changed',
        title: 'Shift assignment removed',
        body: `You were removed from ${shift.title} at ${location.name}.`,
      });
    }

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      notifyCoverage: true,
      notifyDashboard: true,
      userIds: staff ? [staff.id] : undefined,
    });

    return this.buildShiftResponse(shift);
  }

  async publishShift(
    viewer: SessionUser,
    shiftId: string,
  ): Promise<ShiftResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    this.assertShiftPublishReady(shift);

    shift.published = true;
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.published',
        'Published shift to staff.',
      ),
    );

    await this.notifyShiftMutation({
      shift,
      type: 'schedule_published',
      title: 'Schedule published',
      body: `${shift.title} has been published to staff.`,
    });
    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      notifyDashboard: true,
    });

    return this.buildShiftResponse(shift);
  }

  async unpublishShift(
    viewer: SessionUser,
    shiftId: string,
  ): Promise<ShiftResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);

    shift.published = false;
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.unpublished',
        'Moved shift back into draft.',
      ),
    );

    await this.notifyShiftMutation({
      shift,
      type: 'shift_changed',
      title: 'Shift moved back to draft',
      body: `${shift.title} is no longer published.`,
    });
    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      notifyDashboard: true,
    });

    return this.buildShiftResponse(shift);
  }

  async publishVisibleWeek(
    viewer: SessionUser,
    requestedWeekStartDate?: string,
  ): Promise<SchedulingBoardResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const boardWeek = this.resolveBoardWeek(requestedWeekStartDate);

    const visibleShifts = this.getVisibleShiftsForWeek(
      schedulingViewer.record,
      boardWeek,
    );
    const blockers = visibleShifts.filter(
      (shift) => !this.isShiftPublishReady(shift),
    );

    if (blockers.length > 0) {
      throw new HttpException(
        {
          message: `Week is not publish-ready. ${blockers.length} shift${
            blockers.length === 1 ? '' : 's'
          } still need attention.`,
        },
        HttpStatus.CONFLICT,
      );
    }

    for (const shift of visibleShifts) {
      if (!shift.published) {
        shift.published = true;
        shift.updatedByUserId = schedulingViewer.id;
        shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
        shift.auditTrail.push(
          this.createAuditEntry(
            schedulingViewer,
            'shift.published',
            'Published shift as part of the weekly publish action.',
          ),
        );
        await this.notifyShiftMutation({
          shift,
          type: 'schedule_published',
          title: 'Schedule published',
          body: `${shift.title} has been published to staff.`,
        });
      }
    }

    this.emitSchedulingChange({
      locationIds: visibleShifts.map((shift) => shift.locationId),
      notifyDashboard: true,
    });

    return this.getSchedulingBoard(viewer, boardWeek.weekStartDate);
  }

  unpublishVisibleWeek(
    viewer: SessionUser,
    requestedWeekStartDate?: string,
  ): SchedulingBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const boardWeek = this.resolveBoardWeek(requestedWeekStartDate);

    const editablePublishedShifts = this.getVisibleShiftsForWeek(
      schedulingViewer.record,
      boardWeek,
    ).filter((shift) => shift.published && this.isShiftEditable(shift));

    if (editablePublishedShifts.length === 0) {
      throw new HttpException(
        {
          message:
            'No published shifts are still inside the editable cutoff window.',
        },
        HttpStatus.CONFLICT,
      );
    }

    editablePublishedShifts.forEach((shift) => {
      shift.published = false;
      shift.updatedByUserId = schedulingViewer.id;
      shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
      shift.auditTrail.push(
        this.createAuditEntry(
          schedulingViewer,
          'shift.unpublished',
          'Moved shift back to draft as part of the weekly unpublish action.',
        ),
      );
    });

    this.emitSchedulingChange({
      locationIds: editablePublishedShifts.map((shift) => shift.locationId),
      notifyDashboard: true,
    });

    return this.getSchedulingBoard(viewer, boardWeek.weekStartDate);
  }

  getCoverageBoard(viewer: SessionUser): CoverageBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.expireCoverageRequests();

    const visibleRequests = schedulingStore.coverageRequests
      .filter((request) =>
        this.canViewerSeeCoverageRequest(schedulingViewer.record, request),
      )
      .map((request) =>
        this.buildCoverageRequestResponse(request, schedulingViewer),
      )
      .sort((left, right) => left.id.localeCompare(right.id));

    return {
      requests: visibleRequests,
    };
  }

  getCoverageRequestOptions(
    viewer: SessionUser,
    shiftId: string,
  ): CoverageRequestOptionsResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);

    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftAssignedToStaff(shift, schedulingViewer.id);
    const requester = this.getStaffOrNull(schedulingViewer.id);

    if (!requester) {
      throw new NotFoundException('Requester could not be resolved.');
    }

    return {
      shiftId: shift.id,
      shiftTitle: shift.title,
      requester: buildStaffSummary(requester),
      eligibleSwapTargets: this.getEligibleCoverageCandidatesForShift(shift, [
        schedulingViewer.id,
        ...shift.assigneeIds,
      ]),
      eligibleDropClaimants: this.getEligibleCoverageCandidatesForShift(shift, [
        schedulingViewer.id,
        ...shift.assigneeIds,
      ]),
    };
  }

  async createSwapRequest(
    viewer: SessionUser,
    body: CoverageRequestMutationBody,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);

    const shiftId = typeof body.shiftId === 'string' ? body.shiftId.trim() : '';
    const counterpartUserId =
      typeof body.counterpartUserId === 'string'
        ? body.counterpartUserId.trim()
        : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!shiftId || !counterpartUserId) {
      throw new BadRequestException(
        'shiftId and counterpartUserId are required for a swap request.',
      );
    }

    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftAssignedToStaff(shift, schedulingViewer.id);
    this.assertStaffCanCreateCoverageRequest(schedulingViewer.id, shift);

    if (counterpartUserId === schedulingViewer.id) {
      throw new BadRequestException(
        'A swap counterpart must be another staff member.',
      );
    }

    const counterpart = this.getStaffOrNull(counterpartUserId);

    if (!counterpart) {
      throw new NotFoundException('Counterpart staff member not found.');
    }

    if (shift.assigneeIds.includes(counterpart.id)) {
      throw new BadRequestException(
        'The selected counterpart is already assigned to this shift.',
      );
    }

    this.assertStaffEligibleForCoverageShift(shift, counterpart, {
      fallbackMessage: 'The selected counterpart is no longer eligible.',
    });

    const request: CoverageRequestRecord = {
      id: crypto.randomUUID(),
      type: 'swap',
      shiftId: shift.id,
      requestedByUserId: schedulingViewer.id,
      counterpartUserId: counterpart.id,
      status: 'pending_counterparty',
      createdAtUtc: DateTime.utc().toISO() ?? '',
      updatedAtUtc: DateTime.utc().toISO() ?? '',
      expiresAtUtc: shift.startsAtUtc,
      note:
        note ||
        `${schedulingViewer.name} requested a swap with ${counterpart.name}.`,
    };

    schedulingStore.coverageRequests.push(request);
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'coverage.created',
        `Created swap request for ${shift.title}.`,
      ),
    );

    await this.notificationsService.createNotifications({
      userIds: [counterpart.id],
      type: 'coverage_request',
      title: 'Swap request received',
      body: `${schedulingViewer.name} asked to swap ${shift.title} with you.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [schedulingViewer.id, counterpart.id],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async createDropRequest(
    viewer: SessionUser,
    body: CoverageRequestMutationBody,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);

    const shiftId = typeof body.shiftId === 'string' ? body.shiftId.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!shiftId) {
      throw new BadRequestException('shiftId is required for a drop request.');
    }

    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftAssignedToStaff(shift, schedulingViewer.id);
    this.assertStaffCanCreateCoverageRequest(schedulingViewer.id, shift);
    this.assertDropWindowStillOpen(shift);

    const request: CoverageRequestRecord = {
      id: crypto.randomUUID(),
      type: 'drop',
      shiftId: shift.id,
      requestedByUserId: schedulingViewer.id,
      status: 'open',
      createdAtUtc: DateTime.utc().toISO() ?? '',
      updatedAtUtc: DateTime.utc().toISO() ?? '',
      expiresAtUtc: this.getDropRequestExpiryUtc(shift),
      note:
        note ||
        `${schedulingViewer.name} asked the team to cover ${shift.title}.`,
    };

    schedulingStore.coverageRequests.push(request);
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'coverage.created',
        `Created drop request for ${shift.title}.`,
      ),
    );

    await this.notificationsService.createNotifications({
      userIds: this.getEligibleCoverageCandidateUserIds(shift, [
        schedulingViewer.id,
        ...shift.assigneeIds,
      ]),
      type: 'coverage_request',
      title: 'Open shift coverage request',
      body: `${schedulingViewer.name} opened coverage for ${shift.title}.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [schedulingViewer.id],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async acceptCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);
    this.expireCoverageRequests();

    const request = this.getCoverageRequestById(requestId);

    if (request.type !== 'swap' || request.status !== 'pending_counterparty') {
      throw new HttpException(
        { message: 'Only pending swap requests can be accepted.' },
        HttpStatus.CONFLICT,
      );
    }

    if (request.counterpartUserId !== schedulingViewer.id) {
      throw new ForbiddenException(
        'Only the requested counterpart can accept this swap.',
      );
    }

    const shift = this.getAccessibleShift(
      request.shiftId,
      schedulingViewer.record,
    );
    const counterpart = this.getStaffOrNull(schedulingViewer.id);

    if (!counterpart) {
      throw new NotFoundException('Counterpart could not be resolved.');
    }

    this.assertStaffEligibleForCoverageShift(shift, counterpart, {
      fallbackMessage: 'You are no longer eligible for this swap.',
    });

    request.status = 'pending_manager';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';
    request.note = `${counterpart.name} accepted the swap.`;

    await this.notificationsService.createNotifications({
      userIds: this.getManagerAndAdminUserIdsForLocation(
        shift.locationId,
      ).concat([request.requestedByUserId]),
      type: 'coverage_request',
      title: 'Swap ready for approval',
      body: `${counterpart.name} accepted a swap for ${shift.title}.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [request.requestedByUserId, schedulingViewer.id],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async rejectCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);
    this.expireCoverageRequests();

    const request = this.getCoverageRequestById(requestId);

    if (request.type !== 'swap' || request.status !== 'pending_counterparty') {
      throw new HttpException(
        { message: 'Only pending swap requests can be rejected.' },
        HttpStatus.CONFLICT,
      );
    }

    if (request.counterpartUserId !== schedulingViewer.id) {
      throw new ForbiddenException(
        'Only the requested counterpart can reject this swap.',
      );
    }

    request.status = 'rejected';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';
    request.cancellationReason = `${schedulingViewer.name} declined the swap request.`;

    const shift = this.getShiftById(request.shiftId);
    await this.notificationsService.createNotifications({
      userIds: [request.requestedByUserId],
      type: 'coverage_resolved',
      title: 'Swap request declined',
      body: `${schedulingViewer.name} declined the swap for ${shift.title}.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [request.requestedByUserId, schedulingViewer.id],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async claimCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);
    this.expireCoverageRequests();

    const request = this.getCoverageRequestById(requestId);

    if (request.type !== 'drop' || request.status !== 'open') {
      throw new HttpException(
        { message: 'Only open drop requests can be claimed.' },
        HttpStatus.CONFLICT,
      );
    }

    if (request.requestedByUserId === schedulingViewer.id) {
      throw new BadRequestException('You cannot claim your own drop request.');
    }

    const shift = this.getAccessibleShift(
      request.shiftId,
      schedulingViewer.record,
    );
    const claimant = this.getStaffOrNull(schedulingViewer.id);

    if (!claimant) {
      throw new NotFoundException('Claimant could not be resolved.');
    }

    this.assertStaffEligibleForCoverageShift(shift, claimant, {
      fallbackMessage: 'You are no longer eligible to claim this shift.',
    });

    request.claimantUserId = claimant.id;
    request.status = 'pending_manager';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';
    request.note = `${claimant.name} volunteered to cover this shift.`;

    await this.notificationsService.createNotifications({
      userIds: this.getManagerAndAdminUserIdsForLocation(
        shift.locationId,
      ).concat([request.requestedByUserId]),
      type: 'coverage_request',
      title: 'Coverage claim needs approval',
      body: `${claimant.name} claimed ${shift.title}.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [request.requestedByUserId, claimant.id],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async withdrawCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureStaff(schedulingViewer.record);
    this.expireCoverageRequests();

    const request = this.getCoverageRequestById(requestId);

    if (request.requestedByUserId !== schedulingViewer.id) {
      throw new ForbiddenException(
        'Only the requester can withdraw this request.',
      );
    }

    if (
      request.status === 'approved' ||
      request.status === 'expired' ||
      request.status === 'cancelled' ||
      request.status === 'rejected'
    ) {
      throw new HttpException(
        { message: 'Resolved requests cannot be withdrawn.' },
        HttpStatus.CONFLICT,
      );
    }

    request.status = 'cancelled';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';
    request.cancellationReason =
      'Requester withdrew the coverage request before final approval.';

    const shift = this.getShiftById(request.shiftId);

    const relatedUserIds = Array.from(
      new Set(
        [
          request.counterpartUserId,
          request.claimantUserId,
          ...this.getManagerAndAdminUserIdsForLocation(shift.locationId),
        ].filter((candidate): candidate is string => Boolean(candidate)),
      ),
    );

    await this.notificationsService.createNotifications({
      userIds: relatedUserIds,
      type: 'coverage_resolved',
      title: 'Coverage request withdrawn',
      body: `${schedulingViewer.name} withdrew the request for ${shift.title}.`,
    });

    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      requestId: request.id,
      shiftId: shift.id,
      notifyCoverage: true,
      userIds: [schedulingViewer.id, ...relatedUserIds],
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async approveCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    this.expireCoverageRequests();

    const request = this.getCoverageRequestById(requestId);
    const shift = this.getAccessibleShift(
      request.shiftId,
      schedulingViewer.record,
    );

    if (request.status !== 'pending_manager') {
      throw new HttpException(
        { message: 'Only pending manager approvals can be approved.' },
        HttpStatus.CONFLICT,
      );
    }

    const replacementUserId =
      request.type === 'swap'
        ? request.counterpartUserId
        : request.claimantUserId;

    if (!replacementUserId) {
      throw new HttpException(
        { message: 'This request does not yet have a qualified replacement.' },
        HttpStatus.CONFLICT,
      );
    }

    const replacement = this.getStaffOrNull(replacementUserId);

    if (!replacement) {
      throw new NotFoundException('Replacement staff member no longer exists.');
    }

    const evaluation = this.evaluateStaffForShift(shift, replacement, {
      ignoreShiftId: shift.id,
    });

    if (evaluation.status === 'blocked') {
      this.throwAssignmentViolation(
        this.toAssignmentViolationResponse(
          evaluation,
          'Replacement is no longer eligible.',
        ),
      );
    }

    shift.assigneeIds = shift.assigneeIds.filter(
      (assigneeId) => assigneeId !== request.requestedByUserId,
    );
    if (!shift.assigneeIds.includes(replacement.id)) {
      shift.assigneeIds.push(replacement.id);
    }

    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'coverage.approved',
        `${request.type === 'swap' ? 'Approved swap' : 'Approved coverage drop'} for ${
          shift.title
        }.`,
      ),
    );

    request.status = 'approved';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';

    await this.notificationsService.createNotifications({
      userIds: Array.from(
        new Set(
          [
            request.requestedByUserId,
            request.counterpartUserId,
            request.claimantUserId,
          ].filter((candidate): candidate is string => Boolean(candidate)),
        ),
      ),
      type: 'coverage_resolved',
      title: 'Coverage approved',
      body: `${shift.title} coverage has been approved.`,
    });
    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      requestId: request.id,
      notifyCoverage: true,
      notifyDashboard: true,
      userIds: Array.from(
        new Set(
          [
            request.requestedByUserId,
            request.counterpartUserId,
            request.claimantUserId,
          ].filter((candidate): candidate is string => Boolean(candidate)),
        ),
      ),
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  async cancelCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): Promise<CoverageActionResponse> {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const request = this.getCoverageRequestById(requestId);
    this.getAccessibleShift(request.shiftId, schedulingViewer.record);

    if (
      request.status === 'approved' ||
      request.status === 'expired' ||
      request.status === 'cancelled' ||
      request.status === 'rejected'
    ) {
      throw new HttpException(
        { message: 'Resolved requests cannot be cancelled.' },
        HttpStatus.CONFLICT,
      );
    }

    request.status = 'cancelled';
    request.updatedAtUtc = DateTime.utc().toISO() ?? '';
    request.cancellationReason =
      'Cancelled by a manager before final approval.';

    const shift = this.getShiftById(request.shiftId);
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'coverage.cancelled',
        `Cancelled pending ${request.type} request for ${shift.title}.`,
      ),
    );

    await this.notificationsService.createNotifications({
      userIds: Array.from(
        new Set(
          [
            request.requestedByUserId,
            request.counterpartUserId,
            request.claimantUserId,
          ].filter((candidate): candidate is string => Boolean(candidate)),
        ),
      ),
      type: 'coverage_resolved',
      title: 'Coverage request cancelled',
      body: `${shift.title} coverage request is no longer active.`,
    });
    this.emitSchedulingChange({
      locationIds: [shift.locationId],
      shiftId: shift.id,
      requestId: request.id,
      notifyCoverage: true,
      notifyDashboard: true,
      userIds: Array.from(
        new Set(
          [
            request.requestedByUserId,
            request.counterpartUserId,
            request.claimantUserId,
          ].filter((candidate): candidate is string => Boolean(candidate)),
        ),
      ),
    });

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  getEligibleStaffForShift(
    viewer: SessionUser,
    shiftId: string,
  ): EligibleStaffResponse[] {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);

    return this.getVisibleStaffForViewer(schedulingViewer.record)
      .filter((staff) => !shift.assigneeIds.includes(staff.id))
      .map((staff) => ({
        staff,
        evaluation: this.evaluateStaffForShift(shift, staff, {
          ignoreShiftId: shift.id,
          includeSuggestions: false,
        }),
      }))
      .filter((entry) => entry.evaluation.status !== 'blocked')
      .sort((left, right) => {
        const warningDifference =
          left.evaluation.warnings.length - right.evaluation.warnings.length;

        if (warningDifference !== 0) {
          return warningDifference;
        }

        const projectedHourDifference =
          (left.evaluation.projectedWeeklyHours ?? 0) -
          (right.evaluation.projectedWeeklyHours ?? 0);

        if (projectedHourDifference !== 0) {
          return projectedHourDifference;
        }

        return left.staff.name.localeCompare(right.staff.name);
      })
      .map(({ staff, evaluation }) =>
        this.toEligibleStaffResponse(staff, evaluation),
      );
  }

  private getSchedulingViewer(viewer: SessionUser): SchedulingViewer {
    const record = getUserById(viewer.id);

    if (!record) {
      throw new ForbiddenException('Viewer session could not be resolved.');
    }

    return {
      ...viewer,
      record,
    };
  }

  private ensureManagerOrAdmin(viewer: User) {
    if (viewer.role === 'staff') {
      throw new ForbiddenException(
        'This action requires manager or admin access.',
      );
    }
  }

  private ensureStaff(viewer: User): asserts viewer is StaffRecord {
    if (viewer.role !== 'staff') {
      throw new ForbiddenException('This action requires staff access.');
    }
  }

  private toLocationResponse(
    location: LocationRecord,
  ): ScheduleLocationResponse {
    return {
      id: location.id,
      name: location.name,
      code: location.code,
      timeZone: location.timeZone,
      timeZoneLabel: location.timeZoneLabel,
      city: location.city,
      region: location.region,
      country: location.country,
      addressLine: location.addressLine,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  private toScheduleStaffResponse(staff: StaffRecord): ScheduleStaffResponse {
    const desiredHours = schedulingStore.desiredHoursByUserId[staff.id];

    if (typeof desiredHours !== 'number') {
      throw new BadRequestException(
        `Desired hours missing for staff member ${staff.id}.`,
      );
    }

    return {
      ...buildStaffSummary(staff),
      skills: [...staff.skills],
      certifiedLocationIds: [...staff.certifiedLocationIds],
      availabilitySummary: this.describeAvailability(staff),
      desiredHours,
    };
  }

  private getVisibleLocationsForViewer(viewer: User) {
    if (viewer.role === 'admin') {
      return [...schedulingStore.locations];
    }

    const allowedLocationIds =
      viewer.role === 'manager'
        ? viewer.managedLocationIds
        : viewer.certifiedLocationIds;

    return schedulingStore.locations.filter((location) =>
      allowedLocationIds.includes(location.id),
    );
  }

  private getVisibleLocationIdsForViewer(viewer: User) {
    return new Set(
      this.getVisibleLocationsForViewer(viewer).map((location) => location.id),
    );
  }

  private getVisibleStaffForViewer(viewer: User) {
    const visibleLocationIds = this.getVisibleLocationIdsForViewer(viewer);

    return getAllUsers()
      .filter(isStaffRecord)
      .filter((staff) => {
        if (viewer.role === 'staff') {
          return staff.id === viewer.id;
        }

        return staff.certifiedLocationIds.some((locationId) =>
          visibleLocationIds.has(locationId),
        );
      });
  }

  private getVisibleShiftsForViewer(viewer: User) {
    const visibleLocationIds = this.getVisibleLocationIdsForViewer(viewer);

    return schedulingStore.shifts.filter((shift) =>
      visibleLocationIds.has(shift.locationId),
    );
  }

  private getVisibleShiftsForWeek(
    viewer: User,
    boardWeek: { weekStartDate: string; weekEndDate: string },
  ) {
    return this.getVisibleShiftsForViewer(viewer).filter((shift) =>
      this.isShiftInsideBoardWeek(shift, boardWeek),
    );
  }

  private getAccessibleLocation(locationId: string, viewer: User) {
    const location = schedulingStore.locations.find(
      (item) => item.id === locationId,
    );

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    const visibleLocationIds = this.getVisibleLocationIdsForViewer(viewer);
    if (!visibleLocationIds.has(location.id)) {
      throw new ForbiddenException(
        'Viewer does not have access to that location.',
      );
    }

    return location;
  }

  private getAccessibleShift(shiftId: string, viewer: User) {
    const shift = this.getShiftById(shiftId);
    this.getAccessibleLocation(shift.locationId, viewer);
    return shift;
  }

  private getShiftById(shiftId: string) {
    const shift = schedulingStore.shifts.find((item) => item.id === shiftId);

    if (!shift) {
      throw new NotFoundException('Shift not found.');
    }

    return shift;
  }

  private getCoverageRequestById(requestId: string) {
    const request = schedulingStore.coverageRequests.find(
      (item) => item.id === requestId,
    );

    if (!request) {
      throw new NotFoundException('Coverage request not found.');
    }

    return request;
  }

  private getLocationById(locationId: string) {
    const location = schedulingStore.locations.find(
      (item) => item.id === locationId,
    );

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    return location;
  }

  private getStaffOrNull(staffId: string) {
    const user = getUserById(staffId);
    return user && isStaffRecord(user) ? user : null;
  }

  private ensureShiftAssignedToStaff(shift: ShiftRecord, staffId: string) {
    if (!shift.assigneeIds.includes(staffId)) {
      throw new ForbiddenException(
        'Only assigned staff can open coverage requests for this shift.',
      );
    }
  }

  private getActiveCoverageRequestsForUser(userId: string) {
    return schedulingStore.coverageRequests.filter(
      (request) =>
        request.requestedByUserId === userId &&
        (request.status === 'pending_counterparty' ||
          request.status === 'pending_manager' ||
          request.status === 'open'),
    );
  }

  private assertStaffCanCreateCoverageRequest(
    staffId: string,
    shift: ShiftRecord,
  ) {
    const activeRequests = this.getActiveCoverageRequestsForUser(staffId);

    if (activeRequests.length >= 3) {
      throw new HttpException(
        {
          message:
            'Staff can only keep 3 active swap or drop requests at a time.',
        },
        HttpStatus.CONFLICT,
      );
    }

    const existingRequest = schedulingStore.coverageRequests.find(
      (request) =>
        request.shiftId === shift.id &&
        request.requestedByUserId === staffId &&
        (request.status === 'pending_counterparty' ||
          request.status === 'pending_manager' ||
          request.status === 'open'),
    );

    if (existingRequest) {
      throw new HttpException(
        {
          message:
            'There is already an active coverage request for this shift.',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private getDropRequestExpiryUtc(shift: ShiftRecord) {
    return (
      DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' })
        .minus({ hours: 24 })
        .toISO() ?? ''
    );
  }

  private assertDropWindowStillOpen(shift: ShiftRecord) {
    const cutoff = DateTime.fromISO(this.getDropRequestExpiryUtc(shift), {
      zone: 'utc',
    });

    if (DateTime.utc() >= cutoff) {
      throw new HttpException(
        {
          message:
            'Drop requests must be created at least 24 hours before the shift starts.',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private assertStaffEligibleForCoverageShift(
    shift: ShiftRecord,
    staff: StaffRecord,
    options?: { fallbackMessage?: string },
  ) {
    const evaluation = this.evaluateStaffForShift(shift, staff, {
      ignoreShiftId: shift.id,
    });

    if (evaluation.status === 'blocked') {
      this.throwAssignmentViolation(
        this.toAssignmentViolationResponse(
          evaluation,
          options?.fallbackMessage ??
            'That staff member is no longer eligible.',
        ),
      );
    }

    return evaluation;
  }

  private getEligibleCoverageCandidatesForShift(
    shift: ShiftRecord,
    excludedStaffIds: string[] = [],
  ) {
    const excludedIds = new Set(excludedStaffIds);

    return getAllUsers()
      .filter(isStaffRecord)
      .filter((staff) => !excludedIds.has(staff.id))
      .map((staff) => ({
        staff,
        evaluation: this.evaluateStaffForShift(shift, staff, {
          ignoreShiftId: shift.id,
          includeSuggestions: false,
        }),
      }))
      .filter((entry) => entry.evaluation.status !== 'blocked')
      .sort((left, right) => {
        const warningGap =
          left.evaluation.warnings.length - right.evaluation.warnings.length;

        if (warningGap !== 0) {
          return warningGap;
        }

        return (
          (left.evaluation.projectedWeeklyHours ?? 0) -
          (right.evaluation.projectedWeeklyHours ?? 0)
        );
      })
      .map((entry) => buildStaffSummary(entry.staff));
  }

  private getEligibleCoverageCandidateUserIds(
    shift: ShiftRecord,
    excludedStaffIds: string[] = [],
  ) {
    return this.getEligibleCoverageCandidatesForShift(
      shift,
      excludedStaffIds,
    ).map((staff) => staff.id);
  }

  private buildDashboardMetric(
    label: string,
    value: string,
    description: string,
    tone: DashboardMetricResponse['tone'],
  ): DashboardMetricResponse {
    return { label, value, description, tone };
  }

  private getManagerAndAdminUserIdsForLocation(locationId: string) {
    return getAllUsers()
      .filter((user) => {
        if (user.role === 'admin') {
          return true;
        }

        return (
          user.role === 'manager' &&
          user.managedLocationIds.includes(locationId)
        );
      })
      .map((user) => user.id);
  }

  private async notifyShiftMutation(params: {
    shift: ShiftRecord;
    type: NotificationType;
    title: string;
    body: string;
  }) {
    const impactedUserIds = params.shift.assigneeIds;

    if (impactedUserIds.length === 0) {
      return;
    }

    await this.notificationsService.createNotifications({
      userIds: impactedUserIds,
      type: params.type,
      title: params.title,
      body: params.body,
    });
  }

  private emitSchedulingChange(params: {
    locationIds: string[];
    shiftId?: string;
    requestId?: string;
    notifyCoverage?: boolean;
    notifyDashboard?: boolean;
    userIds?: string[];
  }) {
    const locationIds = Array.from(new Set(params.locationIds));

    this.realtimeService.publish({
      topic: 'schedule.updated',
      payload: {
        shiftId: params.shiftId,
        requestId: params.requestId,
        locationIds,
      },
      visibility: {
        locationIds,
        userIds: params.userIds,
      },
    });

    if (params.notifyCoverage) {
      this.realtimeService.publish({
        topic: 'coverage.updated',
        payload: {
          shiftId: params.shiftId,
          requestId: params.requestId,
          locationIds,
        },
        visibility: {
          locationIds,
          userIds: params.userIds,
        },
      });
    }

    if (params.notifyDashboard) {
      this.realtimeService.publish({
        topic: 'dashboard.updated',
        payload: {
          shiftId: params.shiftId,
          requestId: params.requestId,
          locationIds,
        },
        visibility: {
          locationIds,
          userIds: params.userIds,
        },
      });
    }
  }

  private resolveShiftWindow(
    startsAtLocalValue: string,
    location: LocationRecord,
    endsAtLocalValue: string,
  ) {
    // Managers compose shifts in restaurant-local time. If the end clock falls
    // before the start clock, treat it as an overnight shift into the next day.
    const startsAtLocal = DateTime.fromISO(startsAtLocalValue, {
      zone: location.timeZone,
    });
    let endsAtLocal = DateTime.fromISO(endsAtLocalValue, {
      zone: location.timeZone,
    });

    if (!startsAtLocal.isValid || !endsAtLocal.isValid) {
      throw new HttpException(
        { message: `Invalid local date/time supplied for ${location.name}.` },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (endsAtLocal <= startsAtLocal) {
      endsAtLocal = endsAtLocal.plus({ days: 1 });
    }

    if (endsAtLocal <= startsAtLocal) {
      throw new HttpException(
        { message: 'Shift end must be after the shift start.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      startsAtLocal,
      endsAtLocal,
      startsAtUtc: startsAtLocal.toUTC(),
      endsAtUtc: endsAtLocal.toUTC(),
    };
  }

  private resolveDateRange(
    requestedStartDate?: string,
    requestedEndDate?: string,
  ) {
    const fallbackWeek = this.resolveBoardWeek(requestedStartDate);
    const startDate = requestedStartDate ?? fallbackWeek.weekStartDate;
    const endDate = requestedEndDate ?? fallbackWeek.weekEndDate;
    const start = DateTime.fromISO(startDate, { zone: 'utc' }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: 'utc' }).endOf('day');

    if (!start.isValid || !end.isValid || end < start) {
      throw new BadRequestException(
        'startDate and endDate must be valid ISO dates in ascending order.',
      );
    }

    return {
      startDate: start.toISODate() ?? '',
      endDate: end.toISODate() ?? '',
      start,
      end,
    };
  }

  private isAuditEntryInsideRange(
    entry: ShiftAuditRecord,
    period: ReturnType<SchedulingService['resolveDateRange']>,
  ) {
    const timestamp = DateTime.fromISO(entry.atUtc, { zone: 'utc' });
    return timestamp >= period.start && timestamp <= period.end;
  }

  private buildFairnessStaffReport(
    staff: StaffRecord,
    visibleShifts: ShiftRecord[],
    period: ReturnType<SchedulingService['resolveDateRange']>,
  ): FairnessStaffReportResponse {
    const assignedHours = formatHours(
      visibleShifts
        .filter((shift) => shift.assigneeIds.includes(staff.id))
        .reduce((total, shift) => {
          const location = this.getLocationById(shift.locationId);
          return (
            total +
            this.getShiftHoursWithinLocalDateRange(
              shift,
              location,
              period.startDate,
              period.endDate,
            )
          );
        }, 0),
    );
    const daysInPeriod = Math.max(
      period.end.startOf('day').diff(period.start.startOf('day'), 'days').days +
        1,
      1,
    );
    const desiredHours = schedulingStore.desiredHoursByUserId[staff.id] ?? 0;
    const targetHoursForPeriod = formatHours((desiredHours / 7) * daysInPeriod);
    const desiredHoursDelta = formatHours(assignedHours - targetHoursForPeriod);
    const premiumShiftCount = visibleShifts.filter((shift) => {
      if (!shift.assigneeIds.includes(staff.id) || !shift.premium) {
        return false;
      }

      const location = this.getLocationById(shift.locationId);
      return (
        this.getShiftHoursWithinLocalDateRange(
          shift,
          location,
          period.startDate,
          period.endDate,
        ) > 0
      );
    }).length;
    const pendingCoverageRequests = schedulingStore.coverageRequests.filter(
      (request) =>
        request.requestedByUserId === staff.id &&
        (request.status === 'open' ||
          request.status === 'pending_counterparty' ||
          request.status === 'pending_manager'),
    ).length;
    const status =
      desiredHoursDelta > 2
        ? 'over'
        : desiredHoursDelta < -2
          ? 'under'
          : 'balanced';

    return {
      staff: this.toScheduleStaffResponse(staff),
      assignedHours,
      targetHoursForPeriod,
      desiredHoursDelta,
      premiumShiftCount,
      pendingCoverageRequests,
      status,
      note:
        status === 'over'
          ? `${staff.name} is currently over the requested target for the selected period.`
          : status === 'under'
            ? `${staff.name} is currently below the requested target for the selected period.`
            : `${staff.name} is tracking close to their requested hours.`,
    };
  }

  private calculateFairnessScore(teamMembers: FairnessStaffReportResponse[]) {
    if (teamMembers.length === 0) {
      return 100;
    }

    const premiumCounts = teamMembers.map((member) => member.premiumShiftCount);
    const average =
      premiumCounts.reduce((total, count) => total + count, 0) /
      premiumCounts.length;
    const variance =
      premiumCounts.reduce(
        (total, count) => total + (count - average) ** 2,
        0,
      ) / premiumCounts.length;

    return Math.max(
      0,
      Math.min(100, Math.round(100 - Math.sqrt(variance) * 30)),
    );
  }

  private getProjectedOvertimeAssignments(
    shifts: ShiftRecord[],
  ): OvertimeAssignmentResponse[] {
    const entries = shifts
      .flatMap((shift) => {
        const location = this.getLocationById(shift.locationId);
        return shift.assigneeIds.map((staffId) => {
          const staff = this.getStaffOrNull(staffId);

          if (!staff) {
            return null;
          }

          const overtimeHoursAdded = this.getOvertimeHoursAddedByShift(
            staff.id,
            shift,
            location,
          );

          if (overtimeHoursAdded <= 0) {
            return null;
          }

          const response = this.buildShiftResponse(shift);

          return {
            shiftId: shift.id,
            shiftTitle: shift.title,
            staff: buildStaffSummary(staff),
            location: {
              id: location.id,
              name: location.name,
            },
            timeLabel: response.timeLabel,
            overtimeHoursAdded: formatHours(overtimeHoursAdded),
            overtimePremiumCost: formatHours(
              overtimeHoursAdded * OVERTIME_PREMIUM_RATE,
            ),
          } satisfies OvertimeAssignmentResponse;
        });
      })
      .filter((entry): entry is OvertimeAssignmentResponse => Boolean(entry))
      .sort(
        (left, right) => right.overtimePremiumCost - left.overtimePremiumCost,
      );

    return entries;
  }

  private getLaborAlerts(shifts: ShiftRecord[]): LaborAlertResponse[] {
    return shifts
      .flatMap((shift) => {
        const location = this.getLocationById(shift.locationId);
        return shift.assigneeIds.flatMap((staffId) => {
          const staff = this.getStaffOrNull(staffId);

          if (!staff) {
            return [];
          }

          const evaluation = this.evaluateStaffForShift(shift, staff, {
            ignoreShiftId: shift.id,
          });

          return evaluation.warnings.map((warning) => ({
            id: `${shift.id}:${staff.id}:${warning}`,
            severity: (warning.includes('overtime')
              ? 'critical'
              : 'warning') as LaborAlertResponse['severity'],
            message: warning,
            shiftTitle: shift.title,
            locationCode: location.code,
            staff: buildStaffSummary(staff),
          }));
        });
      })
      .sort((left, right) => left.shiftTitle.localeCompare(right.shiftTitle));
  }

  private validateShiftPayload(body: ShiftMutationRequestBody) {
    const title =
      typeof body.title === 'string' ? body.title.trim() : undefined;
    const locationId =
      typeof body.locationId === 'string' ? body.locationId.trim() : '';
    const startsAtLocal =
      typeof body.startsAtLocal === 'string' ? body.startsAtLocal.trim() : '';
    const endsAtLocal =
      typeof body.endsAtLocal === 'string' ? body.endsAtLocal.trim() : '';
    const requiredSkill =
      typeof body.requiredSkill === 'string' ? body.requiredSkill.trim() : '';
    const headcount =
      typeof body.headcount === 'number'
        ? body.headcount
        : Number(body.headcount ?? NaN);

    const fieldErrors: Record<string, string[] | undefined> = {};

    if (!locationId) {
      fieldErrors.locationId = ['Select a location.'];
    }

    if (!startsAtLocal) {
      fieldErrors.startsAtLocal = ['Select a shift start.'];
    }

    if (!endsAtLocal) {
      fieldErrors.endsAtLocal = ['Select a shift end.'];
    }

    if (!requiredSkill) {
      fieldErrors.requiredSkill = ['Select the required skill.'];
    }

    if (!Number.isInteger(headcount) || headcount < 1 || headcount > 12) {
      fieldErrors.headcount = ['Headcount must be between 1 and 12.'];
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new HttpException(
        {
          message: 'Enter a valid location, time window, skill, and headcount.',
          fieldErrors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      title: title ? title : undefined,
      locationId,
      startsAtLocal,
      endsAtLocal,
      requiredSkill,
      headcount,
    };
  }

  private buildShiftResponse(shift: ShiftRecord): ShiftResponse {
    const location = this.getLocationById(shift.locationId);
    const startLocal = this.getShiftStartLocal(shift, location);
    const endLocal = this.getShiftEndLocal(shift, location);
    const assignees = shift.assigneeIds
      .map((staffId) => this.getStaffOrNull(staffId))
      .filter((staff): staff is StaffRecord => Boolean(staff))
      .map((staff) => buildStaffSummary(staff));
    const openSlots = Math.max(shift.headcount - assignees.length, 0);
    const warningMessages = assignees.flatMap((assignee) => {
      const staff = this.getStaffOrNull(assignee.id);
      if (!staff) {
        return [];
      }

      return this.evaluateStaffForShift(shift, staff, {
        ignoreShiftId: shift.id,
      }).warnings;
    });
    const suggestions =
      openSlots > 0
        ? this.getSuggestedAlternatives(shift, shift.assigneeIds)
        : [];
    const hasActiveCoverageRequest = this.hasActiveCoverageRequest(shift.id);
    const state = this.getShiftState({
      openSlots,
      hasActiveCoverageRequest,
      warningMessages,
      suggestions,
    });
    const statusSummary = this.getShiftStatusSummary({
      shift,
      openSlots,
      state,
      hasActiveCoverageRequest,
      warningMessages,
      suggestions,
    });

    return {
      id: shift.id,
      title: shift.title,
      dayKey: startLocal.toFormat('yyyy-MM-dd'),
      dayLabel: startLocal.toFormat('EEEE'),
      dateLabel: startLocal.toFormat('MMM d'),
      timeLabel: `${startLocal.toFormat('h:mm a')} - ${endLocal.toFormat('h:mm a')}`,
      startsAtUtc: shift.startsAtUtc,
      endsAtUtc: shift.endsAtUtc,
      startsAtLocal: startLocal.toFormat("yyyy-MM-dd'T'HH:mm"),
      endsAtLocal: endLocal.toFormat("yyyy-MM-dd'T'HH:mm"),
      location: this.toLocationResponse(location),
      requiredSkill: shift.requiredSkill,
      headcount: shift.headcount,
      assignees,
      openSlots,
      premium: shift.premium,
      published: shift.published,
      canEdit: this.isShiftEditable(shift),
      state,
      statusSummary,
      suggestions,
      warningMessages: Array.from(new Set(warningMessages)),
      auditCount: shift.auditTrail.length,
    };
  }

  private toEligibleStaffResponse(
    staff: StaffRecord,
    evaluation: AssignmentEvaluation,
  ): EligibleStaffResponse {
    return {
      staff: this.toScheduleStaffResponse(staff),
      warningMessages: evaluation.warnings,
      projectedWeeklyHours: evaluation.projectedWeeklyHours,
    };
  }

  private evaluateStaffForShift(
    shift: ShiftRecord,
    staff: StaffRecord,
    options: { ignoreShiftId?: string; includeSuggestions?: boolean } = {},
  ): AssignmentEvaluation {
    const location = this.getLocationById(shift.locationId);
    const otherShifts = schedulingStore.shifts.filter(
      (candidate) =>
        candidate.id !== (options.ignoreShiftId ?? '') &&
        candidate.assigneeIds.includes(staff.id),
    );
    const getSuggestions = () =>
      options.includeSuggestions === false
        ? undefined
        : this.getSuggestedAlternatives(shift, shift.assigneeIds, staff.id);

    if (!staff.skills.includes(shift.requiredSkill)) {
      return this.buildBlockedAssignmentEvaluation({
        code: 'ASSIGNMENT_SKILL_MISMATCH',
        message: `${staff.name} does not have the ${shift.requiredSkill} skill required for this shift.`,
        violatedRule: 'required_skill',
        suggestedStaff: getSuggestions() ?? [],
      });
    }

    if (!staff.certifiedLocationIds.includes(shift.locationId)) {
      return this.buildBlockedAssignmentEvaluation({
        code: 'ASSIGNMENT_LOCATION_CERTIFICATION_MISMATCH',
        message: `${staff.name} is not certified for ${location.name}.`,
        violatedRule: 'location_certification',
        suggestedStaff: getSuggestions() ?? [],
      });
    }

    const availabilityIssue = this.getAvailabilityIssue(staff, shift, location);
    if (availabilityIssue) {
      return this.buildBlockedAssignmentEvaluation({
        code: 'ASSIGNMENT_AVAILABILITY_CONFLICT',
        message: availabilityIssue,
        violatedRule: 'availability_window',
        suggestedStaff: getSuggestions() ?? [],
      });
    }

    for (const otherShift of otherShifts) {
      const otherLocation = this.getLocationById(otherShift.locationId);
      const otherStart = DateTime.fromISO(otherShift.startsAtUtc, {
        zone: 'utc',
      });
      const otherEnd = DateTime.fromISO(otherShift.endsAtUtc, { zone: 'utc' });
      const proposedStart = DateTime.fromISO(shift.startsAtUtc, {
        zone: 'utc',
      });
      const proposedEnd = DateTime.fromISO(shift.endsAtUtc, { zone: 'utc' });

      if (overlaps(proposedStart, proposedEnd, otherStart, otherEnd)) {
        return this.buildBlockedAssignmentEvaluation({
          code: 'ASSIGNMENT_OVERLAP_CONFLICT',
          message: `${staff.name} is already assigned to ${otherShift.title} at ${otherLocation.name}, so this would double-book them.`,
          violatedRule: 'no_overlapping_shifts',
          suggestedStaff: getSuggestions() ?? [],
        });
      }

      const restAfterPrevious = proposedStart.diff(otherEnd, 'hours').hours;
      if (otherEnd <= proposedStart && restAfterPrevious < 10) {
        return this.buildBlockedAssignmentEvaluation({
          code: 'ASSIGNMENT_REST_VIOLATION',
          message: `${staff.name} needs a minimum 10-hour reset after ${otherShift.title}.`,
          violatedRule: 'minimum_rest_between_shifts',
          suggestedStaff: getSuggestions() ?? [],
        });
      }

      const restBeforeNext = otherStart.diff(proposedEnd, 'hours').hours;
      if (proposedEnd <= otherStart && restBeforeNext < 10) {
        return this.buildBlockedAssignmentEvaluation({
          code: 'ASSIGNMENT_REST_VIOLATION',
          message: `${staff.name} would not have the required 10-hour rest before ${otherShift.title}.`,
          violatedRule: 'minimum_rest_between_shifts',
          suggestedStaff: getSuggestions() ?? [],
        });
      }
    }

    const projectedDailyHours = this.getProjectedDailyHours(
      staff.id,
      shift,
      location,
    );
    if (projectedDailyHours > 12) {
      return this.buildBlockedAssignmentEvaluation({
        code: 'ASSIGNMENT_DAILY_HOURS_LIMIT',
        message: `${staff.name} would reach ${formatHours(
          projectedDailyHours,
        )} hours on this local day, which exceeds the 12-hour hard block.`,
        violatedRule: 'daily_hours_hard_block',
        suggestedStaff: getSuggestions() ?? [],
      });
    }

    const consecutiveDays = this.getProjectedConsecutiveDays(
      staff.id,
      shift,
      location,
    );
    if (consecutiveDays >= 7) {
      return this.buildBlockedAssignmentEvaluation({
        code: 'ASSIGNMENT_SEVENTH_CONSECUTIVE_DAY',
        message: `${staff.name} would hit a 7th consecutive day, which requires a manager override flow that has not been used here.`,
        violatedRule: 'seventh_consecutive_day_override_required',
        suggestedStaff: getSuggestions() ?? [],
      });
    }

    const projectedWeeklyHours = this.getProjectedWeeklyHours(
      staff.id,
      shift,
      location,
    );
    const warnings: string[] = [];

    if (projectedDailyHours > 8) {
      warnings.push(
        `${staff.name} would work ${formatHours(
          projectedDailyHours,
        )} hours on this local day, which exceeds the 8-hour warning threshold.`,
      );
    }

    if (projectedWeeklyHours >= 35 && projectedWeeklyHours <= 40) {
      warnings.push(
        `${staff.name} would reach ${formatHours(
          projectedWeeklyHours,
        )} hours for the week, which crosses the overtime warning threshold.`,
      );
    }

    if (projectedWeeklyHours > 40) {
      warnings.push(
        `${staff.name} would reach ${formatHours(
          projectedWeeklyHours,
        )} hours for the week and move into overtime.`,
      );
    }

    if (consecutiveDays === 6) {
      warnings.push(
        `${staff.name} would work a 6th consecutive day with this assignment.`,
      );
    }

    return {
      status: warnings.length > 0 ? 'warning' : 'available',
      warnings,
      projectedWeeklyHours: formatHours(projectedWeeklyHours),
    };
  }

  private buildBlockedAssignmentEvaluation(
    violation: AssignmentViolationResponse,
  ): AssignmentEvaluation {
    return {
      status: 'blocked',
      code: violation.code,
      message: violation.message,
      violatedRule: violation.violatedRule,
      warnings: [],
      suggestedStaff: violation.suggestedStaff,
    };
  }

  private toAssignmentViolationResponse(
    evaluation: AssignmentEvaluation,
    fallbackMessage = 'That assignment is blocked.',
  ): AssignmentViolationResponse {
    return {
      code: evaluation.code ?? 'ASSIGNMENT_CONSTRAINT_VIOLATION',
      message: evaluation.message ?? fallbackMessage,
      violatedRule: evaluation.violatedRule ?? 'assignment_constraint',
      suggestedStaff: evaluation.suggestedStaff ?? [],
    };
  }

  private throwAssignmentViolation(violation: AssignmentViolationResponse) {
    throw new HttpException(violation, HttpStatus.CONFLICT);
  }

  private getAvailabilityIssue(
    staff: StaffRecord,
    shift: ShiftRecord,
    location: LocationRecord,
  ) {
    // Availability is evaluated in the shift location's timezone so a
    // recurring "9:00-17:00" window means local restaurant time everywhere.
    const shiftStart = this.getShiftStartLocal(shift, location);
    const shiftEnd = this.getShiftEndLocal(shift, location);
    const localDateKey = shiftStart.toFormat('yyyy-MM-dd');
    const exception = staff.availability.exceptions.find(
      (entry) => entry.date === localDateKey,
    );

    if (exception) {
      if (!exception.isAvailable) {
        return `${staff.name} marked ${localDateKey} as unavailable for ${location.timeZoneLabel}.`;
      }

      if (
        exception.windows.some((window) =>
          this.isShiftInsideAvailabilityWindow(
            shiftStart,
            shiftEnd,
            window.startTime,
            window.endTime,
          ),
        )
      ) {
        return null;
      }

      return `${staff.name} is outside their one-off availability window for this ${location.timeZoneLabel} shift.`;
    }

    const dayOfWeek = getDayOfWeekKey(shiftStart);
    const recurringWindows = staff.availability.recurring.filter(
      (window) => window.dayOfWeek === dayOfWeek,
    );

    if (recurringWindows.length === 0) {
      return `${staff.name} is not available on ${shiftStart.toFormat('EEEE')} in ${location.timeZoneLabel}.`;
    }

    if (
      recurringWindows.some((window) =>
        this.isShiftInsideAvailabilityWindow(
          shiftStart,
          shiftEnd,
          window.startTime,
          window.endTime,
        ),
      )
    ) {
      return null;
    }

    const endingWindow = recurringWindows[0];
    return `${staff.name} is unavailable because their ${location.timeZoneLabel} availability ends at ${this.formatTime(
      endingWindow.endTime,
    )} and this shift starts at ${shiftStart.toFormat('h:mm a')}.`;
  }

  private isShiftInsideAvailabilityWindow(
    shiftStart: DateTime,
    shiftEnd: DateTime,
    startTime: string,
    endTime: string,
  ) {
    const availabilityStart = this.setLocalClock(
      shiftStart.startOf('day'),
      startTime,
    );
    let availabilityEnd = this.setLocalClock(
      shiftStart.startOf('day'),
      endTime,
    );

    if (availabilityEnd <= availabilityStart) {
      availabilityEnd = availabilityEnd.plus({ days: 1 });
    }

    return shiftStart >= availabilityStart && shiftEnd <= availabilityEnd;
  }

  private setLocalClock(baseDate: DateTime, time: string) {
    const [rawHour = '0', rawMinute = '0'] = time.split(':');

    return baseDate.set({
      hour: Number(rawHour),
      minute: Number(rawMinute),
      second: 0,
      millisecond: 0,
    });
  }

  private getProjectedDailyHours(
    staffId: string,
    proposedShift: ShiftRecord,
    location: LocationRecord,
  ) {
    const dates = this.getShiftCoveredLocalDates(proposedShift, location);

    return dates.reduce((highestHours, dateKey) => {
      const projectedHours = this.getAssignedShiftsForStaff(
        staffId,
        proposedShift.id,
      )
        .concat([proposedShift])
        .reduce((total, shift) => {
          const shiftLocation = this.getLocationById(shift.locationId);
          return (
            total + this.getShiftHoursOnLocalDate(shift, shiftLocation, dateKey)
          );
        }, 0);

      return Math.max(highestHours, projectedHours);
    }, 0);
  }

  private getProjectedWeeklyHours(
    staffId: string,
    proposedShift: ShiftRecord,
    location: LocationRecord,
  ) {
    const weekStart = this.getOperationalWeekStart(
      this.getShiftStartLocal(proposedShift, location),
    );
    const weekEnd = weekStart.plus({ days: 6 }).endOf('day');

    return this.getAssignedShiftsForStaff(staffId, proposedShift.id)
      .concat([proposedShift])
      .reduce((total, shift) => {
        const shiftLocation = this.getLocationById(shift.locationId);
        return (
          total +
          this.getShiftHoursWithinLocalRange(
            shift,
            shiftLocation,
            weekStart,
            weekEnd,
          )
        );
      }, 0);
  }

  private getProjectedConsecutiveDays(
    staffId: string,
    proposedShift: ShiftRecord,
    location: LocationRecord,
  ) {
    const uniqueDates = Array.from(
      new Set(
        this.getAssignedShiftsForStaff(staffId, proposedShift.id)
          .concat([proposedShift])
          .flatMap((shift) =>
            this.getShiftCoveredLocalDates(
              shift,
              this.getLocationById(shift.locationId),
            ),
          ),
      ),
    ).sort();

    let longestRun = 1;
    let currentRun = 1;

    for (let index = 1; index < uniqueDates.length; index += 1) {
      const previousDate = DateTime.fromISO(uniqueDates[index - 1] ?? '', {
        zone: location.timeZone,
      });
      const currentDate = DateTime.fromISO(uniqueDates[index] ?? '', {
        zone: location.timeZone,
      });

      if (currentDate.diff(previousDate, 'days').days === 1) {
        currentRun += 1;
        longestRun = Math.max(longestRun, currentRun);
      } else {
        currentRun = 1;
      }
    }

    return longestRun;
  }

  private getAssignedShiftsForStaff(staffId: string, ignoreShiftId?: string) {
    return schedulingStore.shifts.filter(
      (shift) =>
        shift.id !== ignoreShiftId && shift.assigneeIds.includes(staffId),
    );
  }

  private getOvertimeHoursAddedByShift(
    staffId: string,
    proposedShift: ShiftRecord,
    location: LocationRecord,
  ) {
    const weekStart = this.getOperationalWeekStart(
      this.getShiftStartLocal(proposedShift, location),
    );
    const weekEnd = weekStart.plus({ days: 6 }).endOf('day');
    const assignedHoursBefore = this.getAssignedShiftsForStaff(
      staffId,
      proposedShift.id,
    ).reduce((total, shift) => {
      const shiftLocation = this.getLocationById(shift.locationId);
      return (
        total +
        this.getShiftHoursWithinLocalRange(
          shift,
          shiftLocation,
          weekStart,
          weekEnd,
        )
      );
    }, 0);
    const shiftHoursInsideWeek = this.getShiftHoursWithinLocalRange(
      proposedShift,
      location,
      weekStart,
      weekEnd,
    );

    if (shiftHoursInsideWeek <= 0) {
      return 0;
    }

    const regularCapacityRemaining = Math.max(40 - assignedHoursBefore, 0);
    return Math.max(shiftHoursInsideWeek - regularCapacityRemaining, 0);
  }

  private getOperationalWeekStart(date: DateTime) {
    return date.startOf('day').minus({ days: date.weekday % 7 });
  }

  private getShiftCoveredLocalDates(
    shift: ShiftRecord,
    location: LocationRecord,
  ) {
    const startLocal = this.getShiftStartLocal(shift, location);
    const endLocal = this.getShiftEndLocal(shift, location);
    const dates: string[] = [];
    let cursor = startLocal.startOf('day');
    const lastDay = endLocal.startOf('day');

    while (cursor <= lastDay) {
      dates.push(cursor.toISODate() ?? '');
      cursor = cursor.plus({ days: 1 });
    }

    return dates;
  }

  private getShiftHoursOnLocalDate(
    shift: ShiftRecord,
    location: LocationRecord,
    dateKey: string,
  ) {
    const dayStart = DateTime.fromISO(dateKey, {
      zone: location.timeZone,
    }).startOf('day');
    const dayEnd = dayStart.endOf('day');

    return this.getShiftHoursWithinLocalRange(
      shift,
      location,
      dayStart,
      dayEnd,
    );
  }

  private getShiftHoursWithinLocalDateRange(
    shift: ShiftRecord,
    location: LocationRecord,
    startDate: string,
    endDate: string,
  ) {
    const rangeStart = DateTime.fromISO(startDate, {
      zone: location.timeZone,
    }).startOf('day');
    const rangeEnd = DateTime.fromISO(endDate, {
      zone: location.timeZone,
    }).endOf('day');

    return this.getShiftHoursWithinLocalRange(
      shift,
      location,
      rangeStart,
      rangeEnd,
    );
  }

  private getShiftHoursWithinLocalRange(
    shift: ShiftRecord,
    location: LocationRecord,
    rangeStart: DateTime,
    rangeEnd: DateTime,
  ) {
    // Compliance, fairness, and audit exports all need the same "hours inside
    // a local range" primitive so overnight shifts do not get double-counted.
    const shiftStart = this.getShiftStartLocal(shift, location);
    const shiftEnd = this.getShiftEndLocal(shift, location);
    const boundedStart = shiftStart > rangeStart ? shiftStart : rangeStart;
    const boundedEnd = shiftEnd < rangeEnd ? shiftEnd : rangeEnd;

    if (boundedEnd <= boundedStart) {
      return 0;
    }

    return boundedEnd.diff(boundedStart, 'hours').hours;
  }

  private getSuggestedAlternatives(
    shift: ShiftRecord,
    assignedStaffIds: string[],
    excludedStaffId?: string,
  ) {
    return getAllUsers()
      .filter(isStaffRecord)
      .filter((staff) => staff.id !== excludedStaffId)
      .filter((staff) => !assignedStaffIds.includes(staff.id))
      .map((staff) => ({
        staff,
        evaluation: this.evaluateStaffForShift(shift, staff, {
          ignoreShiftId: shift.id,
          includeSuggestions: false,
        }),
      }))
      .filter((entry) => entry.evaluation.status !== 'blocked')
      .sort((left, right) => {
        const leftWarnings = left.evaluation.warnings.length;
        const rightWarnings = right.evaluation.warnings.length;

        if (leftWarnings !== rightWarnings) {
          return leftWarnings - rightWarnings;
        }

        return (
          (left.evaluation.projectedWeeklyHours ?? 0) -
          (right.evaluation.projectedWeeklyHours ?? 0)
        );
      })
      .slice(0, 3)
      .map((entry) => buildStaffSummary(entry.staff));
  }

  private getShiftState({
    openSlots,
    hasActiveCoverageRequest,
    warningMessages,
    suggestions,
  }: {
    openSlots: number;
    hasActiveCoverageRequest: boolean;
    warningMessages: string[];
    suggestions: StaffSummaryResponse[];
  }): ShiftState {
    if (hasActiveCoverageRequest) {
      return 'pending';
    }

    if (openSlots > 0 && suggestions.length === 0) {
      return 'blocked';
    }

    if (openSlots > 0) {
      return 'open';
    }

    if (warningMessages.length > 0) {
      return 'warning';
    }

    return 'scheduled';
  }

  private getShiftStatusSummary({
    shift,
    openSlots,
    state,
    hasActiveCoverageRequest,
    warningMessages,
    suggestions,
  }: {
    shift: ShiftRecord;
    openSlots: number;
    state: ShiftState;
    hasActiveCoverageRequest: boolean;
    warningMessages: string[];
    suggestions: StaffSummaryResponse[];
  }) {
    if (hasActiveCoverageRequest) {
      return 'Coverage request in progress.';
    }

    if (state === 'blocked' && openSlots > 0 && suggestions.length === 0) {
      return 'No eligible staff found for the remaining open slots.';
    }

    if (state === 'warning' && warningMessages.length > 0) {
      return warningMessages[0];
    }

    if (openSlots > 0) {
      return `${openSlots} ${openSlots === 1 ? 'slot remains' : 'slots remain'} open before this shift can publish cleanly.`;
    }

    if (shift.published) {
      return 'Published to staff and still inside the editable window.';
    }

    return 'Fully staffed and ready to publish.';
  }

  private assertShiftPublishReady(shift: ShiftRecord) {
    if (!this.isShiftPublishReady(shift)) {
      throw new HttpException(
        { message: 'This shift still has blockers and cannot be published.' },
        HttpStatus.CONFLICT,
      );
    }
  }

  private isShiftPublishReady(shift: ShiftRecord) {
    const response = this.buildShiftResponse(shift);
    return (
      response.openSlots === 0 &&
      response.state !== 'blocked' &&
      response.state !== 'pending'
    );
  }

  private isShiftEditable(shift: ShiftRecord) {
    if (shift.forceCutoffPassed) {
      return false;
    }

    const startsAtUtc = DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' });
    return startsAtUtc.diffNow('hours').hours > shift.cutoffHours;
  }

  private ensureShiftEditable(shift: ShiftRecord) {
    if (!this.isShiftEditable(shift)) {
      throw new HttpException(
        {
          message:
            'This shift is already inside the cutoff window and can no longer be edited.',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  private formatTime(value: string) {
    const [hour = '00', minute = '00'] = value.split(':');
    return DateTime.fromObject({
      hour: Number(hour),
      minute: Number(minute),
    }).toFormat('h:mm a');
  }

  private getShiftStartLocal(shift: ShiftRecord, location: LocationRecord) {
    return DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' }).setZone(
      location.timeZone,
    );
  }

  private getShiftEndLocal(shift: ShiftRecord, location: LocationRecord) {
    return DateTime.fromISO(shift.endsAtUtc, { zone: 'utc' }).setZone(
      location.timeZone,
    );
  }

  private isPremiumShift(startsAtLocal: DateTime) {
    return (
      (startsAtLocal.weekday === 5 || startsAtLocal.weekday === 6) &&
      startsAtLocal.hour >= 18
    );
  }

  private describeAvailability(staff: StaffRecord) {
    const recurring = staff.availability.recurring;
    const firstWindow = recurring[0];

    if (!firstWindow) {
      return 'Availability not configured';
    }

    const days = Array.from(
      new Set(recurring.map((window) => window.dayOfWeek)),
    );
    const firstDay = days[0]?.slice(0, 3) ?? 'Day';
    const lastDay = days[days.length - 1]?.slice(0, 3) ?? firstDay;

    return `${toTitleCase(firstDay)}-${toTitleCase(lastDay)}, ${this.formatTime(
      firstWindow.startTime,
    )} - ${this.formatTime(firstWindow.endTime)} per location time`;
  }

  private canViewerSeeCoverageRequest(
    viewer: User,
    request: CoverageRequestRecord,
  ) {
    const shift = this.getShiftById(request.shiftId);
    const visibleLocationIds = this.getVisibleLocationIdsForViewer(viewer);

    if (viewer.role === 'staff') {
      return (
        request.requestedByUserId === viewer.id ||
        request.counterpartUserId === viewer.id ||
        request.claimantUserId === viewer.id ||
        shift.assigneeIds.includes(viewer.id) ||
        (request.type === 'drop' &&
          request.status === 'open' &&
          this.getEligibleCoverageCandidateUserIds(shift, [
            request.requestedByUserId,
            ...shift.assigneeIds,
          ]).includes(viewer.id))
      );
    }

    return visibleLocationIds.has(shift.locationId);
  }

  private buildCoverageRequestResponse(
    request: CoverageRequestRecord,
    viewer: SchedulingViewer,
  ): CoverageRequestResponse {
    const shiftRecord = this.getShiftById(request.shiftId);
    const shift = this.buildShiftResponse(shiftRecord);
    const requestedBy = this.getStaffOrNull(request.requestedByUserId);
    const counterpart = request.counterpartUserId
      ? this.getStaffOrNull(request.counterpartUserId)
      : null;
    const claimant = request.claimantUserId
      ? this.getStaffOrNull(request.claimantUserId)
      : null;
    const viewerRelation = this.getCoverageViewerRelation(
      viewer.record,
      request,
    );

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      expiresInLabel: this.getExpiresInLabel(request),
      note: request.cancellationReason ?? request.note,
      shift: {
        id: shift.id,
        title: shift.title,
        dateLabel: shift.dateLabel,
        timeLabel: shift.timeLabel,
        locationName: shift.location.name,
        locationCode: shift.location.code,
        timeZoneLabel: shift.location.timeZoneLabel,
      },
      requestedBy: requestedBy
        ? buildStaffSummary(requestedBy)
        : {
            id: request.requestedByUserId,
            name: 'Unknown staff',
            email: '',
            role: 'staff',
          },
      counterpart: counterpart ? buildStaffSummary(counterpart) : undefined,
      claimant: claimant ? buildStaffSummary(claimant) : undefined,
      suggestedClaimants: this.getEligibleCoverageCandidatesForShift(
        shiftRecord,
        [
          request.requestedByUserId,
          ...shiftRecord.assigneeIds,
          request.counterpartUserId ?? '',
          request.claimantUserId ?? '',
        ],
      ),
      steps: this.getCoverageSteps(request.type, request.status),
      originalAssignmentRemains:
        request.status === 'pending_counterparty' ||
        request.status === 'pending_manager' ||
        request.status === 'open',
      viewerRelation,
      availableActions: this.getAvailableCoverageActions(
        viewerRelation,
        request,
      ),
    };
  }

  private getCoverageSteps(
    type: CoverageRequestType,
    status: CoverageRequestRecord['status'],
  ): CoverageRequestStep[] {
    if (type === 'swap') {
      if (status === 'pending_counterparty') {
        return [
          { label: 'Requester submitted swap', status: 'done' },
          { label: 'Counterparty acceptance', status: 'current' },
          { label: 'Manager approval', status: 'upcoming' },
          { label: 'Assignments update', status: 'upcoming' },
        ];
      }

      if (status === 'pending_manager') {
        return [
          { label: 'Requester submitted swap', status: 'done' },
          { label: 'Counterparty accepted', status: 'done' },
          { label: 'Manager approval', status: 'current' },
          { label: 'Assignments update', status: 'upcoming' },
        ];
      }

      if (status === 'approved') {
        return [
          { label: 'Requester submitted swap', status: 'done' },
          { label: 'Counterparty accepted', status: 'done' },
          { label: 'Manager approval', status: 'done' },
          { label: 'Assignments update', status: 'done' },
        ];
      }
    }

    if (status === 'open') {
      return [
        { label: 'Staff requested coverage', status: 'done' },
        { label: 'Replacement identified', status: 'current' },
        { label: 'Manager approval', status: 'upcoming' },
        { label: 'Assignments update', status: 'upcoming' },
      ];
    }

    if (status === 'pending_manager') {
      return [
        { label: 'Staff requested coverage', status: 'done' },
        { label: 'Replacement identified', status: 'done' },
        { label: 'Manager approval', status: 'current' },
        { label: 'Assignments update', status: 'upcoming' },
      ];
    }

    if (status === 'approved') {
      return [
        { label: 'Staff request created', status: 'done' },
        { label: 'Replacement confirmed', status: 'done' },
        { label: 'Manager approval', status: 'done' },
        { label: 'Assignments update', status: 'done' },
      ];
    }

    return [
      { label: 'Staff request created', status: 'done' },
      { label: 'Request no longer active', status: 'done' },
      { label: 'Manager approval', status: 'upcoming' },
      { label: 'Assignments update', status: 'upcoming' },
    ];
  }

  private getExpiresInLabel(request: CoverageRequestRecord) {
    const expiresAt = DateTime.fromISO(request.expiresAtUtc, { zone: 'utc' });
    const difference = expiresAt.diffNow(['days', 'hours']).toObject();

    if (
      request.status === 'cancelled' ||
      request.status === 'approved' ||
      request.status === 'rejected'
    ) {
      return 'Closed';
    }

    if (request.status === 'expired') {
      return 'Expired';
    }

    if ((difference.days ?? 0) >= 1) {
      return `${Math.floor(difference.days ?? 0)}d left`;
    }

    return `${Math.max(Math.ceil(difference.hours ?? 0), 1)}h left`;
  }

  private expireCoverageRequests() {
    const now = DateTime.utc();

    schedulingStore.coverageRequests.forEach((request) => {
      if (request.type !== 'drop') {
        return;
      }

      if (request.status !== 'open') {
        return;
      }

      const expiresAt = DateTime.fromISO(request.expiresAtUtc, { zone: 'utc' });
      if (now >= expiresAt) {
        request.status = 'expired';
        request.updatedAtUtc = now.toISO() ?? '';
      }
    });
  }

  private cancelPendingCoverageRequestsForShift(
    shiftId: string,
    actor: SchedulingViewer,
    reason: string,
  ) {
    schedulingStore.coverageRequests.forEach((request) => {
      if (request.shiftId !== shiftId) {
        return;
      }

      if (
        request.status !== 'pending_counterparty' &&
        request.status !== 'pending_manager' &&
        request.status !== 'open'
      ) {
        return;
      }

      request.status = 'cancelled';
      request.updatedAtUtc = DateTime.utc().toISO() ?? '';
      request.cancellationReason = reason;
    });

    const shift = this.getShiftById(shiftId);
    shift.auditTrail.push(
      this.createAuditEntry(
        actor,
        'coverage.cancelled',
        'Cancelled pending coverage requests because the shift changed.',
      ),
    );
  }

  private hasActiveCoverageRequest(shiftId: string) {
    return schedulingStore.coverageRequests.some(
      (request) =>
        request.shiftId === shiftId &&
        (request.status === 'pending_counterparty' ||
          request.status === 'pending_manager' ||
          request.status === 'open'),
    );
  }

  private getCoverageViewerRelation(
    viewer: User,
    request: CoverageRequestRecord,
  ): CoverageRequestViewerRelation {
    const shift = this.getShiftById(request.shiftId);

    if (viewer.role !== 'staff') {
      return 'manager';
    }

    if (request.requestedByUserId === viewer.id) {
      return 'requester';
    }

    if (request.counterpartUserId === viewer.id) {
      return 'counterpart';
    }

    if (request.claimantUserId === viewer.id) {
      return 'claimant';
    }

    if (
      request.type === 'drop' &&
      request.status === 'open' &&
      this.getEligibleCoverageCandidateUserIds(shift, [
        request.requestedByUserId,
        ...shift.assigneeIds,
      ]).includes(viewer.id)
    ) {
      return 'eligible_claimant';
    }

    return 'observer';
  }

  private getAvailableCoverageActions(
    viewerRelation: CoverageRequestViewerRelation,
    request: CoverageRequestRecord,
  ): CoverageRequestAction[] {
    if (viewerRelation === 'manager' && request.status === 'pending_manager') {
      return ['approve', 'cancel'];
    }

    if (viewerRelation === 'requester') {
      if (
        request.status === 'pending_counterparty' ||
        request.status === 'pending_manager' ||
        request.status === 'open'
      ) {
        return ['withdraw'];
      }

      return [];
    }

    if (
      viewerRelation === 'counterpart' &&
      request.type === 'swap' &&
      request.status === 'pending_counterparty'
    ) {
      return ['accept', 'reject'];
    }

    if (
      viewerRelation === 'eligible_claimant' &&
      request.type === 'drop' &&
      request.status === 'open'
    ) {
      return ['claim'];
    }

    return [];
  }

  private createAuditEntry(
    viewer: SchedulingViewer,
    action: ShiftAuditRecord['action'],
    summary: string,
    extra?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    },
  ): ShiftAuditRecord {
    return {
      id: crypto.randomUUID(),
      action,
      actorUserId: viewer.id,
      actorName: viewer.name,
      atUtc: DateTime.utc().toISO() ?? '',
      summary,
      before: extra?.before,
      after: extra?.after,
    };
  }

  private getShiftAuditSnapshot(shift: ShiftRecord) {
    return {
      title: shift.title,
      locationId: shift.locationId,
      startsAtUtc: shift.startsAtUtc,
      endsAtUtc: shift.endsAtUtc,
      requiredSkill: shift.requiredSkill,
      headcount: shift.headcount,
      assigneeIds: [...shift.assigneeIds],
      published: shift.published,
    };
  }

  private resolveBoardWeek(requestedWeekStartDate?: string) {
    const candidate = requestedWeekStartDate
      ? DateTime.fromISO(requestedWeekStartDate, { zone: 'utc' })
      : DateTime.utc();

    if (!candidate.isValid) {
      throw new HttpException(
        { message: 'weekStart must be a valid ISO date.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const normalizedWeekStart = candidate
      .startOf('day')
      .minus({ days: candidate.weekday % 7 });

    return {
      weekStartDate: normalizedWeekStart.toISODate() ?? '',
      weekEndDate: normalizedWeekStart.plus({ days: 6 }).toISODate() ?? '',
    };
  }

  private isShiftInsideBoardWeek(
    shift: ShiftRecord,
    boardWeek: { weekStartDate: string; weekEndDate: string },
  ) {
    const location = this.getLocationById(shift.locationId);
    const shiftLocalDate =
      this.getShiftStartLocal(shift, location).toISODate() ?? '';

    return (
      shiftLocalDate >= boardWeek.weekStartDate &&
      shiftLocalDate <= boardWeek.weekEndDate
    );
  }
}
