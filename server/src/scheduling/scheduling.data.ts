import { DateTime } from 'luxon';

import type {
  CoverageRequestRecord,
  LocationRecord,
  ShiftAuditRecord,
  ShiftRecord,
} from './scheduling.types';

type SchedulingStore = {
  locations: LocationRecord[];
  desiredHoursByUserId: Record<string, number>;
  shifts: ShiftRecord[];
  coverageRequests: CoverageRequestRecord[];
};

const toUtcIso = (localIso: string, timeZone: string) =>
  DateTime.fromISO(localIso, { zone: timeZone }).toUTC().toISO();

if (!toUtcIso('2026-03-30T11:00', 'America/New_York')) {
  throw new Error('Failed to initialize seeded scheduling times.');
}

const makeAuditEntry = (
  summary: string,
  {
    actorUserId = 'usr_admin_ava',
    actorName = 'Ava Thompson',
    action = 'shift.created',
    atUtc = DateTime.utc().toISO(),
  }: {
    actorUserId?: string;
    actorName?: string;
    action?: ShiftAuditRecord['action'];
    atUtc?: string | null;
  } = {},
): ShiftAuditRecord => ({
  id: crypto.randomUUID(),
  action,
  actorUserId,
  actorName,
  atUtc: atUtc ?? DateTime.utc().toISO() ?? '',
  summary,
});

export const schedulingStore: SchedulingStore = {
  locations: [
    {
      id: 'harbor-point-grill',
      name: 'Harbor Point Grill',
      code: 'HPG',
      timeZone: 'America/New_York',
      timeZoneLabel: 'ET',
      city: 'New York',
      region: 'NY',
      country: 'United States',
      addressLine: '85 10th Ave, New York, NY 10011',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=85+10th+Ave+New+York+NY+10011',
      latitude: 40.7422,
      longitude: -74.0064,
    },
    {
      id: 'boardwalk-kitchen',
      name: 'Boardwalk Kitchen',
      code: 'BWK',
      timeZone: 'America/New_York',
      timeZoneLabel: 'ET',
      city: 'Jersey City',
      region: 'NJ',
      country: 'United States',
      addressLine: '30 Hudson St, Jersey City, NJ 07302',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=30+Hudson+St+Jersey+City+NJ+07302',
      latitude: 40.7178,
      longitude: -74.0334,
    },
    {
      id: 'sunset-pier',
      name: 'Sunset Pier',
      code: 'SNP',
      timeZone: 'Africa/Lagos',
      timeZoneLabel: 'WAT',
      city: 'Victoria Island',
      region: 'Lagos',
      country: 'Nigeria',
      addressLine: '1 Ozumba Mbadiwe Ave, Victoria Island, Lagos',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=1+Ozumba+Mbadiwe+Ave+Victoria+Island+Lagos',
      latitude: 6.4317,
      longitude: 3.4215,
    },
    {
      id: 'tidehouse-cantina',
      name: 'Tidehouse Cantina',
      code: 'THC',
      timeZone: 'Africa/Lagos',
      timeZoneLabel: 'WAT',
      city: 'Benin City',
      region: 'Edo',
      country: 'Nigeria',
      addressLine: '12 Airport Rd, Benin City, Edo',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=12+Airport+Rd+Benin+City+Edo',
      latitude: 6.335,
      longitude: 5.6037,
    },
  ],
  desiredHoursByUserId: {
    usr_staff_maria: 30,
    usr_staff_sarah: 32,
    usr_staff_john: 30,
    usr_staff_devon: 34,
    usr_staff_aisha: 34,
    usr_staff_priya: 28,
    usr_staff_noah: 24,
    usr_staff_jamal: 38,
    usr_staff_olivia: 36,
    usr_staff_ethan: 24,
  },
  shifts: [
    {
      id: 'mon-boardwalk-lunch',
      title: 'Lunch Service',
      locationId: 'boardwalk-kitchen',
      startsAtUtc: toUtcIso('2026-03-30T11:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-03-30T16:00', 'America/New_York') ?? '',
      requiredSkill: 'server',
      headcount: 3,
      assigneeIds: ['usr_staff_maria', 'usr_staff_aisha', 'usr_staff_priya'],
      published: true,
      premium: false,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-26T10:15', 'America/New_York') ?? '',
      cutoffHours: 48,
      forceCutoffPassed: true,
      auditTrail: [
        makeAuditEntry('Shift created for the east-coast lunch rush.'),
        makeAuditEntry('Lunch service published to staff.', {
          actorUserId: 'usr_mgr_lauren',
          actorName: 'Lauren Price',
          action: 'shift.published',
          atUtc: toUtcIso('2026-03-27T09:30', 'America/New_York'),
        }),
      ],
    },
    {
      id: 'mon-harbor-dinner',
      title: 'Dinner Line',
      locationId: 'harbor-point-grill',
      startsAtUtc: toUtcIso('2026-03-30T16:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-03-30T22:00', 'America/New_York') ?? '',
      requiredSkill: 'line cook',
      headcount: 2,
      assigneeIds: ['usr_staff_jamal'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T14:10', 'America/New_York') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Dinner line draft created for Harbor Point.'),
      ],
    },
    {
      id: 'tue-sunset-brunch',
      title: 'Beachfront Brunch',
      locationId: 'sunset-pier',
      startsAtUtc: toUtcIso('2026-03-31T09:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-03-31T15:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'host',
      headcount: 2,
      assigneeIds: ['usr_staff_noah', 'usr_staff_devon'],
      published: true,
      premium: false,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T11:00', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Beachfront brunch published for the Lagos team.', {
          actorUserId: 'usr_mgr_maya',
          actorName: 'Maya Torres',
          action: 'shift.published',
          atUtc: toUtcIso('2026-03-27T11:00', 'Africa/Lagos'),
        }),
      ],
    },
    {
      id: 'tue-tidehouse-close',
      title: 'Closing Bar',
      locationId: 'tidehouse-cantina',
      startsAtUtc: toUtcIso('2026-03-31T18:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-01T01:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_sarah'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T16:45', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'warning',
        note: 'One bartender slot is still open before the close can publish.',
        explanation:
          'Sarah covers the certified bartender requirement, but the closing bar still needs a second legal closer before publish.',
        projectedImpact:
          'Assigning John keeps the close balanced without leaning on Devon for another late finish.',
      },
      auditTrail: [
        makeAuditEntry('Drafted Nigeria closing bar coverage.', {
          actorUserId: 'usr_mgr_maya',
          actorName: 'Maya Torres',
        }),
      ],
    },
    {
      id: 'wed-harbor-dinner',
      title: 'Terrace Dinner',
      locationId: 'harbor-point-grill',
      startsAtUtc: toUtcIso('2026-04-01T17:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-04-01T23:00', 'America/New_York') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_devon', 'usr_staff_aisha'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T12:10', 'America/New_York') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Mid-week terrace dinner drafted for Harbor Point.'),
      ],
    },
    {
      id: 'wed-boardwalk-hotline',
      title: 'Hot Line',
      locationId: 'boardwalk-kitchen',
      startsAtUtc: toUtcIso('2026-04-01T14:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-04-01T22:00', 'America/New_York') ?? '',
      requiredSkill: 'line cook',
      headcount: 2,
      assigneeIds: ['usr_staff_jamal', 'usr_staff_olivia'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T13:25', 'America/New_York') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'warning',
        note: 'Olivia stays legal here, but this shift pushes her toward the week’s overtime edge.',
        explanation:
          'Keeping Olivia on Wednesday leaves little flexibility for the weekend and makes any added premium close expensive.',
        projectedImpact:
          'Swapping this assignment to another cook would lower projected overtime before Friday even starts.',
      },
      auditTrail: [
        makeAuditEntry(
          'Boardwalk hot line seeded with Olivia to model overtime drift.',
        ),
      ],
    },
    {
      id: 'thu-sunset-dinner',
      title: 'Sunset Dinner',
      locationId: 'sunset-pier',
      startsAtUtc: toUtcIso('2026-04-02T18:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-03T00:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'server',
      headcount: 2,
      assigneeIds: ['usr_staff_devon'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T17:10', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'blocked',
        note: 'A second assignment attempt was blocked by timezone-aware availability.',
        explanation:
          'Ethan Cole keeps a 9:00 AM - 5:00 PM recurring window in each location’s timezone. This Lagos dinner shift starts after that local window ends.',
        projectedImpact:
          'Aisha is the safest qualified fallback because she stays inside the shift window and does not trigger a rest violation.',
      },
      auditTrail: [
        makeAuditEntry(
          'Sunset Pier dinner seeded with an availability conflict.',
          {
            actorUserId: 'usr_mgr_maya',
            actorName: 'Maya Torres',
          },
        ),
      ],
    },
    {
      id: 'fri-tidehouse-premium',
      title: 'Friday Closing Bar',
      locationId: 'tidehouse-cantina',
      startsAtUtc: toUtcIso('2026-04-03T19:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-04T01:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_sarah', 'usr_staff_devon'],
      published: false,
      premium: true,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T19:00', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Premium Friday bar shift created for Tidehouse.', {
          actorUserId: 'usr_mgr_maya',
          actorName: 'Maya Torres',
        }),
      ],
    },
    {
      id: 'fri-harbor-patio',
      title: 'Patio Server Bank',
      locationId: 'harbor-point-grill',
      startsAtUtc: toUtcIso('2026-04-03T17:30', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-04-03T23:30', 'America/New_York') ?? '',
      requiredSkill: 'server',
      headcount: 4,
      assigneeIds: [
        'usr_staff_maria',
        'usr_staff_aisha',
        'usr_staff_priya',
        'usr_staff_noah',
      ],
      published: false,
      premium: true,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T15:30', 'America/New_York') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Friday premium patio shift drafted for Harbor Point.'),
      ],
    },
    {
      id: 'sat-boardwalk-rush',
      title: 'Saturday Rush',
      locationId: 'boardwalk-kitchen',
      startsAtUtc: toUtcIso('2026-04-04T17:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-04-04T23:00', 'America/New_York') ?? '',
      requiredSkill: 'server',
      headcount: 4,
      assigneeIds: ['usr_staff_maria', 'usr_staff_aisha', 'usr_staff_priya'],
      published: false,
      premium: true,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T17:05', 'America/New_York') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'warning',
        note: 'The final premium slot is still open, and the fairness score will dip if it lands on Maria again.',
        explanation:
          'Priya is closer to her desired hours and Devon can cover without creating a certification or availability problem, so both are better premium balancing options.',
      },
      auditTrail: [
        makeAuditEntry(
          'Saturday rush seeded with a fairness warning for premium distribution.',
        ),
      ],
    },
    {
      id: 'sat-sunset-bar',
      title: 'Pier Bar Close',
      locationId: 'sunset-pier',
      startsAtUtc: toUtcIso('2026-04-04T20:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-05T02:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_sarah', 'usr_staff_john'],
      published: false,
      premium: true,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T20:05', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry('Saturday premium close drafted for Sunset Pier.', {
          actorUserId: 'usr_mgr_maya',
          actorName: 'Maya Torres',
        }),
      ],
    },
    {
      id: 'sun-boardwalk-chaos',
      title: 'Emergency Dinner Coverage',
      locationId: 'boardwalk-kitchen',
      startsAtUtc: toUtcIso('2026-04-05T19:00', 'America/New_York') ?? '',
      endsAtUtc: toUtcIso('2026-04-06T00:00', 'America/New_York') ?? '',
      requiredSkill: 'server',
      headcount: 3,
      assigneeIds: ['usr_staff_maria', 'usr_staff_priya', 'usr_staff_noah'],
      published: true,
      premium: false,
      createdByUserId: 'usr_mgr_lauren',
      updatedByUserId: 'usr_mgr_lauren',
      updatedAtUtc: toUtcIso('2026-03-27T18:30', 'America/New_York') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'pending',
        note: 'A drop request is pending manager approval, but the original assignment still remains live.',
        explanation:
          'Maria is still the scheduled assignee until the manager approves a replacement, which keeps payroll and staffing history consistent.',
      },
      auditTrail: [
        makeAuditEntry('Sunday emergency dinner coverage published to staff.', {
          actorUserId: 'usr_mgr_lauren',
          actorName: 'Lauren Price',
          action: 'shift.published',
          atUtc: toUtcIso('2026-03-27T18:30', 'America/New_York'),
        }),
      ],
    },
    {
      id: 'sun-sunset-lock',
      title: 'Dual-Manager Bartender Conflict',
      locationId: 'sunset-pier',
      startsAtUtc: toUtcIso('2026-04-05T19:00', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-06T01:00', 'Africa/Lagos') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_sarah'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T21:10', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      seedContext: {
        state: 'blocked',
        note: 'Managers can see the conflict instantly if they reach for a bartender already reserved elsewhere.',
        explanation:
          'John Rivera is already reserved against another overlapping Nigeria close, so the backend rejects any second assignment immediately.',
      },
      auditTrail: [
        makeAuditEntry(
          'Conflict scenario seeded for simultaneous bartender assignment.',
          {
            actorUserId: 'usr_mgr_maya',
            actorName: 'Maya Torres',
          },
        ),
      ],
    },
    {
      id: 'sun-tidehouse-closing',
      title: 'Tidehouse Late Close',
      locationId: 'tidehouse-cantina',
      startsAtUtc: toUtcIso('2026-04-05T18:30', 'Africa/Lagos') ?? '',
      endsAtUtc: toUtcIso('2026-04-06T00:30', 'Africa/Lagos') ?? '',
      requiredSkill: 'bartender',
      headcount: 2,
      assigneeIds: ['usr_staff_john'],
      published: false,
      premium: false,
      createdByUserId: 'usr_mgr_maya',
      updatedByUserId: 'usr_mgr_maya',
      updatedAtUtc: toUtcIso('2026-03-27T21:00', 'Africa/Lagos') ?? '',
      cutoffHours: 48,
      auditTrail: [
        makeAuditEntry(
          'Tidehouse late close created to force overlap protection.',
          {
            actorUserId: 'usr_mgr_maya',
            actorName: 'Maya Torres',
          },
        ),
      ],
    },
  ],
  coverageRequests: [
    {
      id: 'cov-1',
      type: 'swap',
      shiftId: 'fri-tidehouse-premium',
      requestedByUserId: 'usr_staff_sarah',
      counterpartUserId: 'usr_staff_john',
      status: 'pending_manager',
      createdAtUtc: toUtcIso('2026-03-28T13:00', 'Africa/Lagos') ?? '',
      updatedAtUtc: toUtcIso('2026-03-28T14:10', 'Africa/Lagos') ?? '',
      expiresAtUtc: toUtcIso('2026-04-03T18:00', 'Africa/Lagos') ?? '',
      note: 'John accepted the swap. Manager approval will finalize the bartender replacement.',
    },
    {
      id: 'cov-2',
      type: 'drop',
      shiftId: 'sun-boardwalk-chaos',
      requestedByUserId: 'usr_staff_maria',
      claimantUserId: 'usr_staff_devon',
      status: 'pending_manager',
      createdAtUtc: toUtcIso('2026-03-28T10:00', 'America/New_York') ?? '',
      updatedAtUtc: toUtcIso('2026-03-28T11:05', 'America/New_York') ?? '',
      expiresAtUtc: toUtcIso('2026-04-04T19:00', 'America/New_York') ?? '',
      note: 'Devon is willing to pick it up, but the original assignment remains with Maria until approval.',
    },
    {
      id: 'cov-3',
      type: 'swap',
      shiftId: 'sat-boardwalk-rush',
      requestedByUserId: 'usr_staff_aisha',
      counterpartUserId: 'usr_staff_devon',
      status: 'cancelled',
      createdAtUtc: toUtcIso('2026-03-28T12:00', 'America/New_York') ?? '',
      updatedAtUtc: toUtcIso('2026-03-28T13:20', 'America/New_York') ?? '',
      expiresAtUtc: toUtcIso('2026-04-04T16:00', 'America/New_York') ?? '',
      note: 'A manager changed the shift after both staff agreed, so the pending swap was cancelled automatically.',
      cancellationReason:
        'Shift edited before approval. Request auto-cancelled and all parties notified.',
    },
  ],
};
