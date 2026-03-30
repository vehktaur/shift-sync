# ShiftSync Evaluator Guide

## Submission status

- The app is in a strong submission-ready state for the assessment.
- The primary product flows are implemented and demoable end to end.
- It is not yet fully production-hardened because simultaneous scheduling writes still need deeper transactional hardening.

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

## Recommended walkthrough

1. Log in as an admin and review the weekly schedule board.
2. Edit a shift and confirm the eligible staff list changes after saving.
3. Assign staff and trigger at least one validation warning or block.
4. Switch to a staff account and create a swap or drop request.
5. Switch to the relevant counterpart or manager account to continue the coverage workflow.
6. Review notifications and the activity log after the change.
7. Check dashboard and team views for overtime and fairness reporting.

## Assumptions

- Notification delivery is in-app only.
- The UI uses the location timezone for scheduling and display, not the viewer timezone.
- Coverage approval applies the change only after all validations pass again.
- One active coverage request per requester/shift is allowed, and each staff member is capped at three active coverage requests.
- 7th consecutive day assignments require a manager override reason before assignment is allowed.

## Known limitations

- Runtime auth, users, scheduling, coverage, and notifications all load from the seeded Postgres dataset.
- Realtime updates use SSE-driven query invalidation rather than full bidirectional sockets.
- Simultaneous assignment protection is validated on the backend, but true transaction-level conflict handling still needs stronger Prisma transaction patterns.
- `On-duty now` is schedule-derived rather than backed by a real clock-in/clock-out system.
- Availability is enforced in scheduling logic, but staff availability management is not yet a complete self-service workflow.

## Production gap checklist

- Add transaction-safe conflict handling for simultaneous assignment and approval operations.
- Add stronger automated test coverage across backend rules and frontend critical flows.
- Add production-grade observability: structured logs, error tracking, health checks, and monitoring.
- Add request hardening such as rate limiting and a fuller session/cookie security review.
- Replace schedule-derived `on-duty now` with a real attendance or clock event model if the product requires live operational accuracy.
