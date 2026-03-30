import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AvailabilityException as PrismaAvailabilityException,
  AvailabilityExceptionWindow as PrismaAvailabilityExceptionWindow,
  CoverageRequest,
  Location,
  ManagerLocation,
  RecurringAvailability,
  Shift,
  ShiftAssignment,
  ShiftAudit,
  StaffLocationCertification,
  User as PrismaUser,
} from '@prisma/client';

import { ROLE_PERMISSIONS } from '../auth/auth.permissions';
import type { DemoAccount, SessionUser, User } from '../auth/auth.types';
import type {
  CoverageRequestRecord,
  LocationRecord,
  ShiftAuditRecord,
  ShiftRecord,
} from '../scheduling/scheduling.types';
import { PrismaService } from './prisma.service';

type PrismaUserWithRelations = PrismaUser & {
  managedLocations: ManagerLocation[];
  certifiedLocations: StaffLocationCertification[];
  recurringAvailability: RecurringAvailability[];
  availabilityExceptions: (PrismaAvailabilityException & {
    windows: PrismaAvailabilityExceptionWindow[];
  })[];
};

type PrismaShiftWithRelations = Shift & {
  assignments: ShiftAssignment[];
  audits: (ShiftAudit & {
    actor: Pick<PrismaUser, 'name'>;
  })[];
};

type RuntimeSchedulingState = {
  locations: LocationRecord[];
  shifts: ShiftRecord[];
  coverageRequests: CoverageRequestRecord[];
  desiredHoursByUserId: Record<string, number>;
};

type RuntimeState = {
  users: User[];
  scheduling: RuntimeSchedulingState;
};

@Injectable()
export class RuntimeDataService implements OnModuleInit {
  private readonly logger = new Logger(RuntimeDataService.name);
  private state: RuntimeState | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.refresh();
    } catch (error) {
      this.logger.error(
        'Runtime data bootstrap failed. Verify DATABASE_URL, run migrations, and seed the database before starting the API.',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async refresh() {
    const [users, locations, shifts, coverageRequests] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          managedLocations: true,
          certifiedLocations: true,
          recurringAvailability: true,
          availabilityExceptions: {
            include: {
              windows: true,
            },
          },
        },
      }),
      this.prisma.location.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.shift.findMany({
        include: {
          assignments: true,
          audits: {
            include: {
              actor: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              atUtc: 'asc',
            },
          },
        },
      }),
      this.prisma.coverageRequest.findMany(),
    ]);

    const runtimeUsers = users.map((user) => this.toRuntimeUser(user));

    this.state = {
      users: runtimeUsers,
      scheduling: {
        locations: locations.map((location) => this.toLocationRecord(location)),
        shifts: shifts.map((shift) => this.toShiftRecord(shift)),
        coverageRequests: coverageRequests.map((request) =>
          this.toCoverageRequestRecord(request),
        ),
        desiredHoursByUserId: Object.fromEntries(
          runtimeUsers
            .filter(
              (user): user is Extract<User, { role: 'staff' }> =>
                user.role === 'staff',
            )
            .map((user) => [
              user.id,
              this.getDesiredHoursForUser(users, user.id),
            ]),
        ),
      },
    };
  }

  getAllUsers() {
    return this.getState().users.map((user) => user);
  }

  getUserById(id: string) {
    return this.getState().users.find((user) => user.id === id) ?? null;
  }

  getDemoAccounts(): DemoAccount[] {
    return this.getAllUsers().map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  getVisibleUsersForViewer(viewer: User): SessionUser[] {
    if (viewer.role === 'admin') {
      return this.getAllUsers().map((user) => this.toSessionUser(user));
    }

    if (viewer.role === 'manager') {
      return this.getAllUsers()
        .filter((candidate) => {
          if (candidate.id === viewer.id) {
            return true;
          }

          return (
            candidate.role === 'staff' &&
            candidate.certifiedLocationIds.some((locationId) =>
              viewer.managedLocationIds.includes(locationId),
            )
          );
        })
        .map((user) => this.toSessionUser(user));
    }

    return [this.toSessionUser(viewer)];
  }

  toSessionUser(user: User): SessionUser {
    const baseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
    } satisfies SessionUser;

    if (user.role === 'manager') {
      return {
        ...baseUser,
        managedLocationIds: [...user.managedLocationIds],
      };
    }

    if (user.role === 'staff') {
      return {
        ...baseUser,
        certifiedLocationIds: [...user.certifiedLocationIds],
        skills: [...user.skills],
      };
    }

    return baseUser;
  }

  getLocations() {
    return this.getState().scheduling.locations;
  }

  getShifts() {
    return this.getState().scheduling.shifts;
  }

  getCoverageRequests() {
    return this.getState().scheduling.coverageRequests;
  }

  getDesiredHoursByUserId() {
    return this.getState().scheduling.desiredHoursByUserId;
  }

  async saveSchedulingState() {
    const schedulingState = this.getState().scheduling;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.shiftAssignment.deleteMany();
      await transaction.shiftAudit.deleteMany();
      await transaction.coverageRequest.deleteMany();
      await transaction.shift.deleteMany();

      // The scheduling service still applies complex assignment and coverage
      // rules in memory. Persist the accepted runtime snapshot as one
      // transaction so the database stays in sync with that source of truth.
      for (const shift of schedulingState.shifts) {
        await transaction.shift.create({
          data: {
            id: shift.id,
            title: shift.title,
            locationId: shift.locationId,
            startsAtUtc: new Date(shift.startsAtUtc),
            endsAtUtc: new Date(shift.endsAtUtc),
            requiredSkill: shift.requiredSkill,
            headcount: shift.headcount,
            published: shift.published,
            premium: shift.premium,
            createdByUserId: shift.createdByUserId,
            updatedByUserId: shift.updatedByUserId,
            updatedAtUtc: new Date(shift.updatedAtUtc),
            cutoffHours: shift.cutoffHours,
            forceCutoffPassed: shift.forceCutoffPassed ?? false,
            assignments: {
              createMany: {
                data: shift.assigneeIds.map((userId) => ({ userId })),
              },
            },
            audits: {
              createMany: {
                data: shift.auditTrail.map((audit) => ({
                  id: audit.id,
                  actorUserId: audit.actorUserId,
                  action: audit.action,
                  summary: audit.summary,
                  atUtc: new Date(audit.atUtc),
                  before: this.toJsonValue(audit.before),
                  after: this.toJsonValue(audit.after),
                })),
              },
            },
          },
        });
      }

      if (schedulingState.coverageRequests.length > 0) {
        await transaction.coverageRequest.createMany({
          data: schedulingState.coverageRequests.map((request) => ({
            id: request.id,
            type: request.type,
            shiftId: request.shiftId,
            requestedByUserId: request.requestedByUserId,
            counterpartUserId: request.counterpartUserId ?? null,
            claimantUserId: request.claimantUserId ?? null,
            status: request.status,
            createdAtUtc: new Date(request.createdAtUtc),
            updatedAtUtc: new Date(request.updatedAtUtc),
            expiresAtUtc: new Date(request.expiresAtUtc),
            note: request.note,
            cancellationReason: request.cancellationReason ?? null,
          })),
        });
      }
    });
  }

  private getState() {
    if (!this.state) {
      throw new InternalServerErrorException(
        'Runtime data has not been initialized.',
      );
    }

    return this.state;
  }

  private getDesiredHoursForUser(users: PrismaUser[], userId: string) {
    return users.find((user) => user.id === userId)?.desiredHours ?? 0;
  }

  private toRuntimeUser(user: PrismaUserWithRelations): User {
    if (user.role === 'admin') {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        accessScope: 'all_locations',
      };
    }

    if (user.role === 'manager') {
      const managedLocationIds = user.managedLocations
        .map((managedLocation) => managedLocation.locationId)
        .sort();

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'manager',
        managedLocationIds: managedLocationIds as [string, ...string[]],
      };
    }

    const certifiedLocationIds = user.certifiedLocations
      .map((certification) => certification.locationId)
      .sort();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'staff',
      certifiedLocationIds: certifiedLocationIds as [string, ...string[]],
      skills: [...user.staffSkills] as [string, ...string[]],
      availability: {
        recurring: user.recurringAvailability.map((window) => ({
          dayOfWeek: window.dayOfWeek,
          startTime: window.startTime,
          endTime: window.endTime,
        })),
        exceptions: user.availabilityExceptions.map((exception) => ({
          date: exception.date.toISOString().slice(0, 10),
          isAvailable: exception.isAvailable,
          windows: exception.windows.map((window) => ({
            startTime: window.startTime,
            endTime: window.endTime,
          })),
        })),
      },
    };
  }

  private toLocationRecord(location: Location): LocationRecord {
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
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
    };
  }

  private toShiftRecord(shift: PrismaShiftWithRelations): ShiftRecord {
    return {
      id: shift.id,
      title: shift.title,
      locationId: shift.locationId,
      startsAtUtc: shift.startsAtUtc.toISOString(),
      endsAtUtc: shift.endsAtUtc.toISOString(),
      requiredSkill: shift.requiredSkill,
      headcount: shift.headcount,
      assigneeIds: shift.assignments.map((assignment) => assignment.userId),
      published: shift.published,
      premium: shift.premium,
      createdByUserId: shift.createdByUserId,
      updatedByUserId: shift.updatedByUserId,
      updatedAtUtc: shift.updatedAtUtc.toISOString(),
      cutoffHours: shift.cutoffHours,
      forceCutoffPassed: shift.forceCutoffPassed,
      auditTrail: shift.audits.map(
        (audit): ShiftAuditRecord => ({
          id: audit.id,
          action: audit.action as ShiftAuditRecord['action'],
          actorUserId: audit.actorUserId,
          actorName: audit.actor.name,
          atUtc: audit.atUtc.toISOString(),
          summary: audit.summary,
          before:
            audit.before && typeof audit.before === 'object'
              ? (audit.before as Record<string, unknown>)
              : undefined,
          after:
            audit.after && typeof audit.after === 'object'
              ? (audit.after as Record<string, unknown>)
              : undefined,
        }),
      ),
    };
  }

  private toCoverageRequestRecord(
    request: CoverageRequest,
  ): CoverageRequestRecord {
    return {
      id: request.id,
      type: request.type,
      shiftId: request.shiftId,
      requestedByUserId: request.requestedByUserId,
      counterpartUserId: request.counterpartUserId ?? undefined,
      claimantUserId: request.claimantUserId ?? undefined,
      status: request.status,
      createdAtUtc: request.createdAtUtc.toISOString(),
      updatedAtUtc: request.updatedAtUtc.toISOString(),
      expiresAtUtc: request.expiresAtUtc.toISOString(),
      note: request.note,
      cancellationReason: request.cancellationReason ?? undefined,
    };
  }

  private toJsonValue(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (!value) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }
}
