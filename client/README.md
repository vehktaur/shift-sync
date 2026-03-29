# ShiftSync Client

Next.js 16 frontend for the Coastal Eats scheduling workspace.

## Run

```bash
npm install
npm run dev
```

Default app URL: `http://localhost:3000`

Set `NEXT_PUBLIC_API_BASE_URL` if the Nest API is not running at `http://localhost:3001/api`.

## Frontend structure

- `src/hooks/use-auth.ts`
  Reusable TanStack Query hook for the active session.
- `src/hooks/use-scheduling.ts`
  Shared schedule and coverage queries/mutations. Any request reused across components lives here.
- `src/stores/schedule-ui-store.ts`
  Zustand store for schedule-only UI state such as filters and the active composer dialog.
- `src/components/schedule/`
  Schedule board feature components plus a workspace provider that exposes board data/actions to the feature tree.
- `src/components/coverage/`
  Coverage queue feature components plus a workspace provider for shared queue actions.
- `src/components/shared/`
  Reusable UI building blocks that are feature-agnostic.

Top-level `src/components/schedule-view.tsx` and `src/components/coverage-view.tsx` are intentionally thin re-export wrappers so route imports stay stable while feature code lives in smaller files.

## Scheduling UI notes

- The schedule and coverage screens poll their TanStack queries so the UI can stay in sync with backend changes without a manual refresh.
- Remote scheduling data stays in TanStack Query, while Zustand is only used for cross-component UI state. That keeps the server cache in one place and avoids duplicating backend data into a separate global store.
- The shift composer dialog does not reset on every poll. It only resets when the dialog opens for a different shift or for a brand-new shift draft.
- Buttons use the shared `loading` prop from `src/components/ui/button.tsx` instead of manually swapping labels/spinners in each feature component.
- Skeleton states are rendered for schedule, coverage, and sidebar session loading so the app does not flash empty layouts during data fetches.

## Current backend-backed flows

- Login against the Nest auth endpoints
- Weekly schedule board fetch
- Shift create and edit
- Staff assignment and removal
- Shift publish and unpublish
- Week publish and unpublish
- Coverage queue fetch
- Coverage approve and cancel
