# ShiftSync Evaluator Guide

## Demo accounts

All demo accounts use:

```txt
Coastal123!
```

Recommended logins:

- Admin: `ava.admin@coastaleats.com`
- Manager: `lauren.manager@coastaleats.com`
- Manager: `maya.manager@coastaleats.com`
- Staff: `maria.staff@coastaleats.com`
- Staff: `ethan.staff@coastaleats.com`
- Staff: `aisha.staff@coastaleats.com`

## Local run

Server:

```bash
cd server
npm install
npm run start:dev
```

Client:

```bash
cd client
npm install
npm run dev
```

Default URLs:

- Client: `http://localhost:3000`
- API: `http://localhost:3001/api`

## What to test

- Weekly schedule board with Sunday-Saturday pagination
- Shift create/edit and staff assignment validation
- Eligible staff endpoint driven assignment panel
- Overtime, daily-hour, consecutive-day, and premium-shift analytics
- Coverage flows:
  - staff can request swap
  - counterpart can accept or reject
  - staff can open drop request
  - eligible staff can claim
  - requester can withdraw before approval
  - manager can approve or cancel final requests
- In-app notification center, SSE invalidation, and audit history
- Activity log page for shift history and admin export

## Assumptions

- Notification delivery is in-app only.
- The UI uses the location timezone for scheduling and display, not the viewer timezone.
- Coverage approval applies the change only after all validations pass again.
- One active coverage request per requester/shift is allowed, and each staff member is capped at three active coverage requests.
- 7th consecutive day assignments require a manager override reason before assignment is allowed.

## Known limitations

- The Prisma/PostgreSQL layer is scaffolded in the Nest app, but current runtime scheduling/auth flows still use the in-memory seed store while the migration to Prisma is being completed.
- Realtime updates use SSE-driven query invalidation rather than full bidirectional sockets.
- The app is not deployed to a public URL yet.
- Simultaneous assignment protection is validated on the backend, but true transaction-level conflict handling will be stronger after the Prisma migration is completed.
