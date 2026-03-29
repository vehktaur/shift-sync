# ShiftSync Server

NestJS API for the Coastal Eats scheduling platform.

## Run

```bash
npm install
npm run start:dev
```

Default API URL: `http://localhost:3001/api`

## Environment

Create `.env` from `.env.example`.

Important values:

- `PORT`
- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SESSION_COOKIE_SECURE`

Example local Postgres connection:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shift_sync?schema=public
```

## Prisma / PostgreSQL setup

The Nest app now has a real Prisma-backed PostgreSQL layer.

- Prisma config: `prisma.config.ts`
- Schema: `prisma/schema.prisma`
- Seed script: `prisma/seed.ts`
- Generated client: `@prisma/client`
- Nest Prisma service: `src/database/prisma.service.ts`

Useful commands:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run db:studio
```

The seed script mirrors the current mock domain:

- demo users and roles
- managed/certified locations
- recurring availability and exceptions
- seeded shifts and assignments
- shift audit trail
- coverage requests
- notification preferences and seeded notifications

## Seeded auth accounts

All demo accounts use the same password:

```txt
Coastal123!
```

Examples:

- `ava.admin@coastaleats.com`
- `lauren.manager@coastaleats.com`
- `maya.manager@coastaleats.com`
- seeded staff accounts in `src/auth/mock-users.ts`

## Runtime status

The database layer is configured and ready, but the current auth and scheduling services still read from the in-memory seed sources while we migrate endpoint logic incrementally.

Current runtime sources:

- `src/scheduling/scheduling.data.ts`
- `src/auth/mock-users.ts`

Current database sources:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/database/prisma.service.ts`
- `src/notifications/notifications.service.ts`

That means:

- Postgres is now set up inside the Nest app
- the schema is ready for production-style persistence
- notifications are already persisted through Prisma/Postgres
- the next migration step is swapping auth and scheduling service methods from the in-memory store to Prisma queries

## Timezone handling

The API stores shift timestamps in UTC, but shift creation accepts local restaurant time.

Current seeded locations:

- Harbor Point Grill: `America/New_York`
- Boardwalk Kitchen: `America/New_York`
- Sunset Pier: `Africa/Lagos`
- Tidehouse Cantina: `Africa/Lagos`

Why this matters:

- overlap checks run in UTC
- availability is evaluated in the shift location's timezone
- recurring windows such as `09:00-17:00` mean local restaurant time, not browser time
- overnight shifts are treated as one continuous shift even when they cross midnight locally

## Enforced scheduling rules

The current shift assignment flow enforces:

- staff must have the required skill
- staff must be certified for the location
- no double-booking across locations
- minimum 10 hours of rest between shifts
- local daily hours warning at 8 and block at 12
- weekly overtime warning at 35+ hours and overtime flag above 40
- consecutive-day warning at 6 days and block at 7
- publish blockers for open or invalid shifts

## Coverage rules

Current coverage endpoints model:

- swap and drop request boards
- staff-created swap and drop requests
- counterpart accept and reject flows
- eligible staff claim flow for drops
- requester withdraw flow before approval
- max three active requests per requester
- original assignment remains until final approval
- pending coverage requests can be cancelled when a shift changes
- expired drop handling inside the in-memory store

## Operations, realtime, notifications, and audit

The server now also exposes:

- operations dashboard analytics for overtime, compliance, fairness, and on-duty-now
- realtime SSE updates for schedule, coverage, dashboard, and notification invalidation
- Postgres-backed notifications with read state and in-app preference controls
- shift audit history plus admin audit export by date range and location

Important implementation notes:

- overtime and daily-hour checks split overnight shifts across the local calendar days they touch
- weekly calculations follow the same Sunday-Saturday operational week used by the schedule board
- 7th consecutive day assignments require a manager override reason before they can be committed
- audit export stays role-gated: managers can inspect shift history, admins can export logs
- realtime is intentionally transport-only; the frontend still uses TanStack Query as the source of truth after invalidation

## Main endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/locations`
- `GET /api/shifts/board`
- `GET /api/shifts/:shiftId/eligible-staff`
- `POST /api/shifts`
- `PATCH /api/shifts/:shiftId`
- `POST /api/shifts/:shiftId/assignments`
- `DELETE /api/shifts/:shiftId/assignments/:staffId`
- `POST /api/shifts/:shiftId/publish`
- `POST /api/shifts/:shiftId/unpublish`
- `POST /api/shifts/actions/publish-week`
- `POST /api/shifts/actions/unpublish-week`
- `GET /api/coverage/board`
- `GET /api/coverage/shifts/:shiftId/options`
- `POST /api/coverage/requests/swap`
- `POST /api/coverage/requests/drop`
- `POST /api/coverage/requests/:requestId/accept`
- `POST /api/coverage/requests/:requestId/reject`
- `POST /api/coverage/requests/:requestId/claim`
- `POST /api/coverage/requests/:requestId/withdraw`
- `POST /api/coverage/requests/:requestId/approve`
- `POST /api/coverage/requests/:requestId/cancel`
- `GET /api/operations/dashboard`
- `GET /api/operations/fairness`
- `GET /api/operations/on-duty-now`
- `GET /api/notifications`
- `GET /api/notifications/preferences`
- `PATCH /api/notifications/preferences`
- `PATCH /api/notifications/:notificationId/read`
- `POST /api/notifications/actions/read-all`
- `GET /api/events/stream`
- `GET /api/audit/shifts/:shiftId`
- `GET /api/audit/export`
