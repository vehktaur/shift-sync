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
- `SESSION_SECRET`
- `SESSION_COOKIE_SECURE`

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

## Scheduling model

The scheduling domain is intentionally in-memory for now.

- Seed data lives in `src/scheduling/scheduling.data.ts`
- Users live in `src/auth/mock-users.ts`
- API logic lives in `src/scheduling/scheduling.service.ts`

Restarting the server resets shifts and coverage requests back to the seeded state.

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
- original assignment remains until final approval
- pending coverage requests can be cancelled when a shift changes
- expired drop handling inside the in-memory store

## Main endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/locations`
- `GET /api/shifts/board`
- `POST /api/shifts`
- `PATCH /api/shifts/:shiftId`
- `POST /api/shifts/:shiftId/assignments`
- `DELETE /api/shifts/:shiftId/assignments/:staffId`
- `POST /api/shifts/:shiftId/publish`
- `POST /api/shifts/:shiftId/unpublish`
- `POST /api/shifts/actions/publish-week`
- `POST /api/shifts/actions/unpublish-week`
- `GET /api/coverage/board`
- `POST /api/coverage/requests/:requestId/approve`
- `POST /api/coverage/requests/:requestId/cancel`
