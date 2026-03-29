# ShiftSync Client

Next.js 16 frontend for the Coastal Eats scheduling workspace.

## Run

```bash
npm install
npm run dev
```

Default app URL: `http://localhost:3000`

Set `API_BASE_URL` if the Nest API is not running at `http://localhost:3001/api`.

For production, the browser talks to the app's own `/api/proxy/...` route and the proxy forwards requests to Nest using `API_BASE_URL`. This keeps auth cookies on the frontend domain so server-rendered session checks work across separate frontend and backend hosts.

## Frontend structure

- `src/hooks/use-auth.ts`
  Reusable TanStack Query hook for the active session.
- `src/hooks/use-scheduling.ts`
  Shared schedule and coverage queries/mutations. Any request reused across components lives here.
- `src/stores/schedule-store.ts`
  Zustand store for schedule UI state only, such as filters, dialog mode, and the currently open shift id.
- `src/components/schedule/`
  Schedule board feature components plus schedule-specific view hooks.
- `src/components/coverage/`
  Coverage queue feature components.
- `src/components/dashboard/`
  Overview dashboard components backed by the Nest analytics endpoints.
- `src/components/team/`
  Fairness and hours distribution views backed by the Nest analytics endpoints.
- `src/components/notifications/`
  In-app notification center and preference management components.
- `src/components/activity/`
  Activity log tables for shift history and admin audit export.
- `src/components/shared/`
  Reusable UI building blocks that are feature-agnostic.

Top-level `src/components/schedule-view.tsx` and `src/components/coverage-view.tsx` are intentionally thin re-export wrappers so route imports stay stable while feature code lives in smaller files.

## Scheduling UI notes

- The schedule and coverage screens poll their TanStack queries so the UI can stay in sync with backend changes without a manual refresh.
- Remote scheduling data stays in TanStack Query. Zustand is only used for client-side UI state.
- The shift composer dialog does not reset on every poll. It only resets when the dialog opens for a different shift or for a brand-new shift draft.
- Saving a shift keeps the composer open. After a shift has an id, the assignment panel fetches eligible staff from the backend with that id.
- Buttons use the shared `loading` prop from `src/components/ui/button.tsx` instead of manually swapping labels/spinners in each feature component.
- Skeleton states are rendered for schedule, coverage, and sidebar session loading so the app does not flash empty layouts during data fetches.
- A lightweight SSE bridge lives in `src/components/realtime-bridge.tsx` and only invalidates TanStack Query keys. Server data still comes from the corresponding query hooks, not from Zustand or ad hoc socket state.

## Current backend-backed flows

- Login against the Nest auth endpoints
- Operations overview dashboard
- Team fairness and hours report
- Notification center and preference updates
- Activity log with shift history and admin export
- Weekly schedule board fetch
- Shift create and edit
- Staff assignment and removal
- Shift publish and unpublish
- Week publish and unpublish
- Coverage queue fetch
- Coverage approve, cancel, accept, reject, claim, and withdraw
- Coverage request option lookup by shift
- Staff-created swap and drop requests
- 7th-day override prompt with documented manager reason
