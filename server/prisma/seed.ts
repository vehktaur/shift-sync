import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { DEMO_PASSWORD } from '../src/auth/auth.constants';
import { ROLE_PERMISSIONS } from '../src/auth/auth.permissions';
import { getAllUsers } from '../src/auth/mock-users';
import { schedulingStore } from '../src/scheduling/scheduling.data';

const DEFAULT_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/shift_sync?schema=public';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  }),
});

const seedUsers = async () => {
  const users = getAllUsers();

  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessScope: user.role === 'admin' ? user.accessScope : undefined,
        desiredHours:
          user.role === 'staff'
            ? schedulingStore.desiredHoursByUserId[user.id] ?? null
            : null,
        demoPassword: DEMO_PASSWORD,
        staffSkills: user.role === 'staff' ? [...user.skills] : [],
        permissions: [...ROLE_PERMISSIONS[user.role]],
      },
    });

    if (user.role === 'manager') {
      await prisma.managerLocation.createMany({
        data: user.managedLocationIds.map((locationId) => ({
          userId: user.id,
          locationId,
        })),
      });
      continue;
    }

    if (user.role !== 'staff') {
      continue;
    }

    await prisma.staffLocationCertification.createMany({
      data: user.certifiedLocationIds.map((locationId) => ({
        userId: user.id,
        locationId,
      })),
    });

    await prisma.recurringAvailability.createMany({
      data: user.availability.recurring.map((window) => ({
        userId: user.id,
        dayOfWeek: window.dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime,
      })),
    });

    for (const exception of user.availability.exceptions) {
      await prisma.availabilityException.create({
        data: {
          userId: user.id,
          date: new Date(`${exception.date}T00:00:00.000Z`),
          isAvailable: exception.isAvailable,
          windows: {
            create: exception.windows.map((window) => ({
              startTime: window.startTime,
              endTime: window.endTime,
            })),
          },
        },
      });
    }
  }
};

const seedLocations = async () => {
  await prisma.location.createMany({
    data: schedulingStore.locations.map((location) => ({
      id: location.id,
      name: location.name,
      code: location.code,
      timeZone: location.timeZone,
      timeZoneLabel: location.timeZoneLabel,
      city: location.city,
      region: location.region,
      country: location.country,
      addressLine: location.addressLine,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    })),
  });
};

const toJsonValue = (
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined => {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
};

const seedShifts = async () => {
  for (const shift of schedulingStore.shifts) {
    await prisma.shift.create({
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
        cutoffHours: shift.cutoffHours,
        forceCutoffPassed: shift.forceCutoffPassed ?? false,
        createdByUserId: shift.createdByUserId,
        updatedByUserId: shift.updatedByUserId,
        updatedAtUtc: new Date(shift.updatedAtUtc),
        assignments: {
          create: shift.assigneeIds.map((userId) => ({
            userId,
          })),
        },
        audits: {
          create: shift.auditTrail.map((audit) => ({
            id: audit.id,
            actorUserId: audit.actorUserId,
            action: audit.action,
            summary: audit.summary,
            atUtc: new Date(audit.atUtc),
            before: toJsonValue(audit.before),
            after: toJsonValue(audit.after),
          })),
        },
      },
    });
  }
};

const seedCoverageRequests = async () => {
  await prisma.coverageRequest.createMany({
    data: schedulingStore.coverageRequests.map((request) => ({
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
};

const seedNotificationPreferences = async () => {
  await prisma.notificationPreference.createMany({
    data: getAllUsers().map((user) => ({
      userId: user.id,
      scheduleUpdates: true,
      coverageUpdates: true,
      overtimeWarnings: true,
      availabilityUpdates: true,
    })),
  });
};

const seedNotifications = async () => {
  const now = DateTime.utc();

  await prisma.notification.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        userId: 'usr_mgr_lauren',
        type: 'overtime_warning',
        title: 'Overtime risk on Boardwalk',
        body: 'Olivia Brooks is trending above 35 hours this week if Wednesday stays assigned.',
        createdAtUtc: now.minus({ hours: 3 }).toJSDate(),
      },
      {
        id: crypto.randomUUID(),
        userId: 'usr_mgr_maya',
        type: 'coverage_request',
        title: 'Coverage request needs approval',
        body: 'A drop request for Friday Closing Bar is waiting on manager approval.',
        createdAtUtc: now.minus({ hours: 2 }).toJSDate(),
      },
      {
        id: crypto.randomUUID(),
        userId: 'usr_staff_maria',
        type: 'shift_changed',
        title: 'Shift updated',
        body: 'Lunch Service at Boardwalk Kitchen was updated and is still inside the editable window.',
        createdAtUtc: now.minus({ hours: 6 }).toJSDate(),
        readAtUtc: now.minus({ hours: 1 }).toJSDate(),
      },
    ],
  });
};

async function main() {
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.shiftAudit.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.coverageRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.availabilityExceptionWindow.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.recurringAvailability.deleteMany();
  await prisma.staffLocationCertification.deleteMany();
  await prisma.managerLocation.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  await seedLocations();
  await seedUsers();
  await seedShifts();
  await seedCoverageRequests();
  await seedNotificationPreferences();
  await seedNotifications();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Database seed failed.', error);
    await prisma.$disconnect();
    process.exit(1);
  });
