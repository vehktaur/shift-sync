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
import { schedulingStore } from './scheduling.data';
import type {
  AssignmentOptionResponse,
  CoverageActionResponse,
  CoverageBoardResponse,
  CoverageRequestRecord,
  CoverageRequestResponse,
  CoverageRequestStep,
  CoverageRequestType,
  LocationRecord,
  PublishBlockerResponse,
  ScheduleLocationResponse,
  ScheduleStaffResponse,
  SchedulingBoardResponse,
  SchedulingViewer,
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
  message?: string;
  warnings: string[];
  suggestions?: StaffSummaryResponse[];
  projectedWeeklyHours?: number;
};

const DEFAULT_CUTOFF_HOURS = 48;
const DEFAULT_WEEK_DATE = '2026-03-30';
const SHIFT_SKILLS = ['bartender', 'line cook', 'server', 'host'];

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
  getLocations(viewer: SessionUser): ScheduleLocationResponse[] {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    return this.getVisibleLocationsForViewer(schedulingViewer.record).map(
      (location) => this.toLocationResponse(location),
    );
  }

  getSchedulingBoard(viewer: SessionUser): SchedulingBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.expireCoverageRequests();

    const visibleLocations = this.getVisibleLocationsForViewer(
      schedulingViewer.record,
    );
    const visibleStaff = this.getVisibleStaffForViewer(schedulingViewer.record);
    const visibleShifts = this.getVisibleShiftsForViewer(
      schedulingViewer.record,
    );
    const shiftResponses = visibleShifts
      .map((shift) => this.buildShiftResponse(shift, schedulingViewer))
      .sort((left, right) => left.startsAtUtc.localeCompare(right.startsAtUtc));

    const weekDates = shiftResponses.map((shift) => shift.dayKey).sort();
    const weekStartDate = weekDates[0] ?? DEFAULT_WEEK_DATE;
    const weekEndDate = weekDates[weekDates.length - 1] ?? DEFAULT_WEEK_DATE;
    const publishBlockers = shiftResponses
      .filter(
        (shift) =>
          shift.openSlots > 0 ||
          shift.state === 'blocked' ||
          shift.state === 'pending',
      )
      .map((shift) => this.toPublishBlocker(shift));

    return {
      weekLabel: `Week of ${this.formatDateForRange(weekStartDate)} - ${this.formatDateForRange(
        weekEndDate,
      )}`,
      weekStartDate,
      weekEndDate,
      publishCutoffHours: DEFAULT_CUTOFF_HOURS,
      locations: visibleLocations.map((location) =>
        this.toLocationResponse(location),
      ),
      staffDirectory: visibleStaff
        .map((staff) => this.toScheduleStaffResponse(staff))
        .sort((left, right) => left.name.localeCompare(right.name)),
      skills: [...SHIFT_SKILLS],
      shifts: shiftResponses,
      summary: {
        totalShiftCount: shiftResponses.length,
        openShiftCount: shiftResponses.filter((shift) => shift.openSlots > 0)
          .length,
        riskShiftCount: shiftResponses.filter(
          (shift) => shift.state === 'warning' || shift.state === 'blocked',
        ).length,
        premiumShiftCount: shiftResponses.filter((shift) => shift.premium)
          .length,
        publishedShiftCount: shiftResponses.filter((shift) => shift.published)
          .length,
      },
      publishBlockers,
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
    const startsAtUtc = this.toUtcFromLocationLocal(
      validated.startsAtLocal,
      location,
    );
    const endsAtUtc = this.toUtcFromLocationLocal(
      validated.endsAtLocal,
      location,
    );

    if (endsAtUtc <= startsAtUtc) {
      throw new HttpException(
        { message: 'Shift end must be after the shift start.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const shift: ShiftRecord = {
      id: crypto.randomUUID(),
      title:
        validated.title ?? `${toTitleCase(validated.requiredSkill)} coverage`,
      locationId: location.id,
      startsAtUtc: startsAtUtc.toUTC().toISO() ?? '',
      endsAtUtc: endsAtUtc.toUTC().toISO() ?? '',
      requiredSkill: validated.requiredSkill,
      headcount: validated.headcount,
      assigneeIds: [],
      published: false,
      premium: this.isPremiumShift(startsAtUtc.setZone(location.timeZone)),
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
    return this.buildShiftResponse(shift, schedulingViewer);
  }

  updateShift(
    viewer: SessionUser,
    shiftId: string,
    body: ShiftMutationRequestBody,
  ): ShiftResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    const validated = this.validateShiftPayload(body);
    const location = this.getAccessibleLocation(
      validated.locationId,
      schedulingViewer.record,
    );
    const startsAtUtc = this.toUtcFromLocationLocal(
      validated.startsAtLocal,
      location,
    );
    const endsAtUtc = this.toUtcFromLocationLocal(
      validated.endsAtLocal,
      location,
    );

    if (endsAtUtc <= startsAtUtc) {
      throw new HttpException(
        { message: 'Shift end must be after the shift start.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const before = this.getShiftAuditSnapshot(shift);

    shift.title = validated.title ?? shift.title;
    shift.locationId = location.id;
    shift.startsAtUtc = startsAtUtc.toUTC().toISO() ?? '';
    shift.endsAtUtc = endsAtUtc.toUTC().toISO() ?? '';
    shift.requiredSkill = validated.requiredSkill;
    shift.headcount = validated.headcount;
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.premium = this.isPremiumShift(startsAtUtc.setZone(location.timeZone));
    shift.seedContext = undefined;
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

    return this.buildShiftResponse(shift, schedulingViewer);
  }

  assignStaff(
    viewer: SessionUser,
    shiftId: string,
    staffId: string,
  ): ShiftResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    const staff = this.getVisibleStaffForViewer(schedulingViewer.record).find(
      (candidate) => candidate.id === staffId,
    );

    if (!staff) {
      throw new NotFoundException(
        'That staff member is not visible to this viewer.',
      );
    }

    if (shift.assigneeIds.includes(staff.id)) {
      return this.buildShiftResponse(shift, schedulingViewer);
    }

    if (shift.assigneeIds.length >= shift.headcount) {
      throw new HttpException(
        { message: 'This shift is already filled to headcount.' },
        HttpStatus.CONFLICT,
      );
    }

    const evaluation = this.evaluateStaffForShift(shift, staff, {
      ignoreShiftId: shift.id,
    });

    if (evaluation.status === 'blocked') {
      throw new HttpException(
        { message: evaluation.message ?? 'That assignment is blocked.' },
        HttpStatus.CONFLICT,
      );
    }

    shift.assigneeIds.push(staff.id);
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.seedContext = undefined;
    shift.auditTrail.push(
      this.createAuditEntry(
        schedulingViewer,
        'shift.assignee_added',
        `Assigned ${staff.name} to the shift.`,
      ),
    );

    return this.buildShiftResponse(shift, schedulingViewer);
  }

  removeAssignee(
    viewer: SessionUser,
    shiftId: string,
    staffId: string,
  ): ShiftResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);

    if (!shift.assigneeIds.includes(staffId)) {
      return this.buildShiftResponse(shift, schedulingViewer);
    }

    shift.assigneeIds = shift.assigneeIds.filter(
      (assigneeId) => assigneeId !== staffId,
    );
    shift.updatedByUserId = schedulingViewer.id;
    shift.updatedAtUtc = DateTime.utc().toISO() ?? '';
    shift.seedContext = undefined;

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

    return this.buildShiftResponse(shift, schedulingViewer);
  }

  publishShift(viewer: SessionUser, shiftId: string): ShiftResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const shift = this.getAccessibleShift(shiftId, schedulingViewer.record);
    this.ensureShiftEditable(shift);
    this.assertShiftPublishReady(shift, schedulingViewer);

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

    return this.buildShiftResponse(shift, schedulingViewer);
  }

  unpublishShift(viewer: SessionUser, shiftId: string): ShiftResponse {
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

    return this.buildShiftResponse(shift, schedulingViewer);
  }

  publishVisibleWeek(viewer: SessionUser): SchedulingBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);

    const visibleShifts = this.getVisibleShiftsForViewer(
      schedulingViewer.record,
    );
    const blockers = visibleShifts.filter(
      (shift) => !this.isShiftPublishReady(shift, schedulingViewer),
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

    visibleShifts.forEach((shift) => {
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
      }
    });

    return this.getSchedulingBoard(viewer);
  }

  unpublishVisibleWeek(viewer: SessionUser): SchedulingBoardResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);

    const editablePublishedShifts = this.getVisibleShiftsForViewer(
      schedulingViewer.record,
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

    return this.getSchedulingBoard(viewer);
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
      summary: {
        totalRequests: visibleRequests.length,
        managerActionCount: visibleRequests.filter(
          (request) => request.status === 'pending_manager',
        ).length,
        dropRequestCount: visibleRequests.filter(
          (request) => request.type === 'drop',
        ).length,
        swapRequestCount: visibleRequests.filter(
          (request) => request.type === 'swap',
        ).length,
      },
    };
  }

  approveCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): CoverageActionResponse {
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
      throw new HttpException(
        { message: evaluation.message ?? 'Replacement is no longer eligible.' },
        HttpStatus.CONFLICT,
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
    shift.seedContext =
      shift.seedContext?.state === 'pending' ? undefined : shift.seedContext;
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

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
  }

  cancelCoverageRequest(
    viewer: SessionUser,
    requestId: string,
  ): CoverageActionResponse {
    const schedulingViewer = this.getSchedulingViewer(viewer);
    this.ensureManagerOrAdmin(schedulingViewer.record);
    const request = this.getCoverageRequestById(requestId);
    this.getAccessibleShift(request.shiftId, schedulingViewer.record);

    if (request.status === 'approved' || request.status === 'expired') {
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

    return {
      success: true,
      request: this.buildCoverageRequestResponse(request, schedulingViewer),
    };
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
      mapUrl: location.mapUrl,
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

  private toUtcFromLocationLocal(value: string, location: LocationRecord) {
    // Shift forms submit local restaurant time; normalize once here so every
    // downstream overlap, rest, and overtime check can run against UTC.
    const dateTime = DateTime.fromISO(value, { zone: location.timeZone });

    if (!dateTime.isValid) {
      throw new HttpException(
        { message: `Invalid local date/time supplied for ${location.name}.` },
        HttpStatus.BAD_REQUEST,
      );
    }

    return dateTime.toUTC();
  }

  private buildShiftResponse(
    shift: ShiftRecord,
    viewer: SchedulingViewer,
  ): ShiftResponse {
    const location = this.getLocationById(shift.locationId);
    const startLocal = this.getShiftStartLocal(shift, location);
    const endLocal = this.getShiftEndLocal(shift, location);
    const assignees = shift.assigneeIds
      .map((staffId) => this.getStaffOrNull(staffId))
      .filter((staff): staff is StaffRecord => Boolean(staff))
      .map((staff) => buildStaffSummary(staff));
    const visibleStaff = this.getVisibleStaffForViewer(viewer.record);
    const assignmentOptions = visibleStaff
      .map((staff) => this.toAssignmentOptionResponse(shift, staff))
      .sort((left, right) => left.staff.name.localeCompare(right.staff.name));
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
    const state = this.getShiftState({
      shift,
      openSlots,
      warningMessages,
      suggestions,
    });
    const note = this.getShiftNote({ shift, openSlots, state });

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
      note,
      explanation: shift.seedContext?.explanation,
      projectedImpact: shift.seedContext?.projectedImpact,
      suggestions:
        shift.seedContext?.suggestions
          ?.map((name) => this.findStaffSummaryByName(name))
          .filter((summary): summary is StaffSummaryResponse =>
            Boolean(summary),
          ) ?? suggestions,
      warningMessages: Array.from(new Set(warningMessages)),
      assignmentOptions,
      auditCount: shift.auditTrail.length,
    };
  }

  private toAssignmentOptionResponse(
    shift: ShiftRecord,
    staff: StaffRecord,
  ): AssignmentOptionResponse {
    if (shift.assigneeIds.includes(staff.id)) {
      return {
        staff: this.toScheduleStaffResponse(staff),
        status: 'assigned',
      };
    }

    const evaluation = this.evaluateStaffForShift(shift, staff, {
      ignoreShiftId: shift.id,
    });

    return {
      staff: this.toScheduleStaffResponse(staff),
      status:
        evaluation.status === 'blocked'
          ? 'blocked'
          : evaluation.status === 'warning'
            ? 'warning'
            : 'available',
      message: evaluation.message,
      suggestions: evaluation.suggestions,
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
      return {
        status: 'blocked',
        message: `${staff.name} does not have the ${shift.requiredSkill} skill required for this shift.`,
        warnings: [],
        suggestions: getSuggestions(),
      };
    }

    if (!staff.certifiedLocationIds.includes(shift.locationId)) {
      return {
        status: 'blocked',
        message: `${staff.name} is not certified for ${location.name}.`,
        warnings: [],
        suggestions: getSuggestions(),
      };
    }

    const availabilityIssue = this.getAvailabilityIssue(staff, shift, location);
    if (availabilityIssue) {
      return {
        status: 'blocked',
        message: availabilityIssue,
        warnings: [],
        suggestions: getSuggestions(),
      };
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
        return {
          status: 'blocked',
          message: `${staff.name} is already assigned to ${otherShift.title} at ${otherLocation.name}, so this would double-book them.`,
          warnings: [],
          suggestions: getSuggestions(),
        };
      }

      const restAfterPrevious = proposedStart.diff(otherEnd, 'hours').hours;
      if (otherEnd <= proposedStart && restAfterPrevious < 10) {
        return {
          status: 'blocked',
          message: `${staff.name} needs a minimum 10-hour reset after ${otherShift.title}.`,
          warnings: [],
          suggestions: getSuggestions(),
        };
      }

      const restBeforeNext = otherStart.diff(proposedEnd, 'hours').hours;
      if (proposedEnd <= otherStart && restBeforeNext < 10) {
        return {
          status: 'blocked',
          message: `${staff.name} would not have the required 10-hour rest before ${otherShift.title}.`,
          warnings: [],
          suggestions: getSuggestions(),
        };
      }
    }

    const projectedDailyHours = this.getProjectedDailyHours(
      staff.id,
      shift,
      location,
    );
    if (projectedDailyHours > 12) {
      return {
        status: 'blocked',
        message: `${staff.name} would reach ${formatHours(
          projectedDailyHours,
        )} hours on this local day, which exceeds the 12-hour hard block.`,
        warnings: [],
        suggestions: getSuggestions(),
      };
    }

    const consecutiveDays = this.getProjectedConsecutiveDays(
      staff.id,
      shift,
      location,
    );
    if (consecutiveDays >= 7) {
      return {
        status: 'blocked',
        message: `${staff.name} would hit a 7th consecutive day, which requires a manager override flow that has not been used here.`,
        warnings: [],
        suggestions: getSuggestions(),
      };
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
    const targetDate = this.getShiftStartLocal(
      proposedShift,
      location,
    ).toFormat('yyyy-MM-dd');

    return this.getAssignedShiftsForStaff(staffId, proposedShift.id)
      .concat([proposedShift])
      .filter((shift) => {
        const localStart = this.getShiftStartLocal(shift, location);
        return localStart.toFormat('yyyy-MM-dd') === targetDate;
      })
      .reduce((total, shift) => total + this.getShiftDurationHours(shift), 0);
  }

  private getProjectedWeeklyHours(
    staffId: string,
    proposedShift: ShiftRecord,
    location: LocationRecord,
  ) {
    const weekStart = this.getShiftStartLocal(proposedShift, location).startOf(
      'week',
    );
    const weekEnd = weekStart.plus({ days: 6 }).endOf('day');

    return this.getAssignedShiftsForStaff(staffId, proposedShift.id)
      .concat([proposedShift])
      .filter((shift) => {
        const localStart = this.getShiftStartLocal(shift, location);
        return localStart >= weekStart && localStart <= weekEnd;
      })
      .reduce((total, shift) => total + this.getShiftDurationHours(shift), 0);
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
          .map((shift) =>
            this.getShiftStartLocal(shift, location).toFormat('yyyy-MM-dd'),
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

  private getShiftDurationHours(shift: ShiftRecord) {
    const startsAt = DateTime.fromISO(shift.startsAtUtc, { zone: 'utc' });
    const endsAt = DateTime.fromISO(shift.endsAtUtc, { zone: 'utc' });

    return endsAt.diff(startsAt, 'hours').hours;
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
    shift,
    openSlots,
    warningMessages,
    suggestions,
  }: {
    shift: ShiftRecord;
    openSlots: number;
    warningMessages: string[];
    suggestions: StaffSummaryResponse[];
  }): ShiftState {
    if (shift.seedContext?.state) {
      return shift.seedContext.state;
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

  private getShiftNote({
    shift,
    openSlots,
    state,
  }: {
    shift: ShiftRecord;
    openSlots: number;
    state: ShiftState;
  }) {
    if (shift.seedContext?.note) {
      return shift.seedContext.note;
    }

    if (state === 'pending') {
      return 'A workflow request is still waiting on manager action.';
    }

    if (openSlots > 0) {
      return `${openSlots} ${openSlots === 1 ? 'slot remains' : 'slots remain'} open before this shift can publish cleanly.`;
    }

    if (shift.published) {
      return 'Published to staff and still inside the editable window.';
    }

    return 'Fully staffed and ready to publish.';
  }

  private toPublishBlocker(shift: ShiftResponse): PublishBlockerResponse {
    return {
      id: shift.id,
      title: shift.title,
      state: shift.state,
      locationCode: shift.location.code,
      timeLabel: shift.timeLabel,
      reason: shift.explanation ?? shift.note,
    };
  }

  private assertShiftPublishReady(
    shift: ShiftRecord,
    viewer: SchedulingViewer,
  ) {
    if (!this.isShiftPublishReady(shift, viewer)) {
      throw new HttpException(
        { message: 'This shift still has blockers and cannot be published.' },
        HttpStatus.CONFLICT,
      );
    }
  }

  private isShiftPublishReady(shift: ShiftRecord, viewer: SchedulingViewer) {
    const response = this.buildShiftResponse(shift, viewer);
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

  private formatDateForRange(value: string) {
    return DateTime.fromISO(value, { zone: 'utc' }).toFormat('MMM d');
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

  private findStaffSummaryByName(name: string) {
    const user = getAllUsers().find((candidate) => candidate.name === name);
    return user ? buildStaffSummary(user) : null;
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
        shift.assigneeIds.includes(viewer.id)
      );
    }

    return visibleLocationIds.has(shift.locationId);
  }

  private buildCoverageRequestResponse(
    request: CoverageRequestRecord,
    viewer: SchedulingViewer,
  ): CoverageRequestResponse {
    const shift = this.buildShiftResponse(
      this.getShiftById(request.shiftId),
      viewer,
    );
    const requestedBy = this.getStaffOrNull(request.requestedByUserId);
    const counterpart = request.counterpartUserId
      ? this.getStaffOrNull(request.counterpartUserId)
      : null;
    const claimant = request.claimantUserId
      ? this.getStaffOrNull(request.claimantUserId)
      : null;

    return {
      id: request.id,
      type: request.type,
      status: request.status,
      statusLabel: this.getCoverageStatusLabel(request.status),
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
        mapUrl: shift.location.mapUrl,
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
      suggestedClaimants: this.getSuggestedAlternatives(
        this.getShiftById(request.shiftId),
        this.getShiftById(request.shiftId).assigneeIds,
      ),
      steps: this.getCoverageSteps(request.type, request.status),
      originalAssignmentRemains:
        request.status === 'pending_counterparty' ||
        request.status === 'pending_manager' ||
        request.status === 'open',
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

  private getCoverageStatusLabel(status: CoverageRequestRecord['status']) {
    switch (status) {
      case 'pending_counterparty':
        return 'Waiting on counterpart';
      case 'pending_manager':
        return 'Manager approval pending';
      case 'open':
        return 'Open for claim';
      case 'approved':
        return 'Approved';
      case 'expired':
        return 'Expired';
      default:
        return 'Cancelled';
    }
  }

  private getExpiresInLabel(request: CoverageRequestRecord) {
    const expiresAt = DateTime.fromISO(request.expiresAtUtc, { zone: 'utc' });
    const difference = expiresAt.diffNow(['days', 'hours']).toObject();

    if (request.status === 'cancelled' || request.status === 'approved') {
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
        request.status !== 'pending_manager'
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
}
