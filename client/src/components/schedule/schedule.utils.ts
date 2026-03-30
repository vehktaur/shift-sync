import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";

import { getApiErrorMessage } from "@/lib/api/client";
import type {
  ShiftFormInputValues,
  ShiftFormValues,
} from "@/lib/schemas";
import type { ApiErrorResponse } from "@/types/auth";
import type {
  ShiftResponse,
  ShiftState,
} from "@/types/scheduling";

export type ShiftFilter = "all" | "open" | "risk";

export const shiftFilters: Array<{ label: string; value: ShiftFilter }> = [
  { label: "All shifts", value: "all" },
  { label: "Open shifts", value: "open" },
  { label: "Warnings", value: "risk" },
];

export const getCurrentWeekStartDate = () =>
  format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");

export const getAdjacentWeekStartDate = (
  weekStartDate: string,
  direction: -1 | 1,
) => format(addWeeks(new Date(`${weekStartDate}T00:00:00`), direction), "yyyy-MM-dd");

export const getWeekEndDate = (weekStartDate: string) =>
  format(addDays(new Date(`${weekStartDate}T00:00:00`), 6), "yyyy-MM-dd");

export const formatWeekRangeLabel = (
  weekStartDate: string,
  weekEndDate: string,
) =>
  `${format(new Date(`${weekStartDate}T00:00:00`), "MMM d")} - ${format(
    new Date(`${weekEndDate}T00:00:00`),
    "MMM d, yyyy",
  )}`;

export const shiftStateBadgeVariant: Record<
  ShiftState,
  "default" | "warning" | "critical" | "neutral" | "success"
> = {
  scheduled: "success",
  open: "warning",
  warning: "warning",
  blocked: "critical",
  pending: "neutral",
};

export const shiftStateLabels: Record<ShiftState, string> = {
  scheduled: "Scheduled",
  open: "Needs staff",
  warning: "Needs review",
  blocked: "Blocked",
  pending: "Pending",
};

export const shiftStateDescriptions: Record<ShiftState, string> = {
  scheduled: "This shift has enough staff and no active blockers.",
  open: "This shift still needs staff before it is fully covered.",
  warning: "This shift can proceed, but it has warnings you should review.",
  blocked: "This shift has an issue that prevents a safe assignment or publish.",
  pending: "This shift is waiting on a follow-up action before it is ready.",
};

export type ScheduleBoardSummary = {
  totalShiftCount: number;
  openShiftCount: number;
  riskShiftCount: number;
  premiumShiftCount: number;
  publishedShiftCount: number;
};

export type PublishBlockerItem = {
  id: string;
  title: string;
  state: ShiftState;
  locationCode: string;
  timeLabel: string;
  reason: string;
};

export const buildScheduleBoardSummary = (
  shifts: ShiftResponse[],
): ScheduleBoardSummary => ({
  totalShiftCount: shifts.length,
  openShiftCount: shifts.filter((shift) => shift.openSlots > 0).length,
  riskShiftCount: shifts.filter(
    (shift) => shift.state === "warning" || shift.state === "blocked",
  ).length,
  premiumShiftCount: shifts.filter((shift) => shift.premium).length,
  publishedShiftCount: shifts.filter((shift) => shift.published).length,
});

// The board endpoint stays week-scoped and lean, so UI aggregates are derived
// locally from the visible shifts instead of being duplicated in the payload.
export const buildPublishBlockers = (
  shifts: ShiftResponse[],
): PublishBlockerItem[] =>
  shifts
    .filter(
      (shift) =>
        shift.openSlots > 0 ||
        shift.state === "blocked" ||
        shift.state === "pending",
    )
    .map((shift) => ({
      id: shift.id,
      title: shift.title,
      state: shift.state,
      locationCode: shift.location.code,
      timeLabel: shift.timeLabel,
      reason: shift.statusSummary,
    }));

export const buildDefaultShiftValues = ({
  defaultLocationId,
  defaultSkill,
  weekStartDate,
}: {
  defaultLocationId: string;
  defaultSkill: string;
  weekStartDate: string;
}): ShiftFormValues => ({
  title: "",
  locationId: defaultLocationId,
  startsAtLocal: `${weekStartDate}T17:00`,
  endsAtLocal: `${weekStartDate}T23:00`,
  requiredSkill: defaultSkill,
  headcount: 2,
});

export const toShiftFormValues = (shift: ShiftResponse): ShiftFormValues => ({
  title: shift.title,
  locationId: shift.location.id,
  startsAtLocal: shift.startsAtLocal,
  endsAtLocal: shift.endsAtLocal,
  requiredSkill: shift.requiredSkill,
  headcount: shift.headcount,
});

export const applyShiftFormError = (
  form: UseFormReturn<ShiftFormInputValues, unknown, ShiftFormValues>,
  error: unknown,
  fallbackMessage: string,
) => {
  const message = getApiErrorMessage(error, fallbackMessage);
  const fieldErrors = axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.fieldErrors
    : undefined;

  if (fieldErrors) {
    for (const [field, messages] of Object.entries(fieldErrors)) {
      const firstMessage = messages?.[0];
      if (!firstMessage) {
        continue;
      }

      if (
        field === "title" ||
        field === "locationId" ||
        field === "startsAtLocal" ||
        field === "endsAtLocal" ||
        field === "requiredSkill" ||
        field === "headcount"
      ) {
        form.setError(field, { message: firstMessage });
      }
    }
  }

  form.setError("root", { message });
  toast.error(message);
};

export const formatProjectedHours = (hours?: number) =>
  typeof hours === "number"
    ? `${hours.toFixed(1)}h after this shift`
    : null;

type ShiftLockedAction =
  | "assign"
  | "edit"
  | "delete"
  | "publish"
  | "save"
  | "change";

const shiftLockedActionReasons: Record<ShiftLockedAction, string> = {
  assign:
    "This shift has already started, so assignments can no longer be changed.",
  edit: "This shift is inside the cutoff window, so you can no longer edit it.",
  delete:
    "This shift is inside the cutoff window, so you can no longer delete it.",
  publish:
    "This shift has already started, so its publish status can no longer be changed.",
  save: "This shift is inside the cutoff window, so you can no longer save detail changes.",
  change:
    "This shift is inside the cutoff window, so it can no longer be changed.",
};

export const getShiftEditLockReason = (
  action: ShiftLockedAction = "change",
) => shiftLockedActionReasons[action];

export const getProjectedHoursExplanation = () =>
  "Estimated total scheduled hours for the selected week if assigned to this shift.";

export type ScheduleDayGroup = {
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  shifts: ShiftResponse[];
};

export const groupShiftsByDay = (shifts: ShiftResponse[]) => {
  const groups = new Map<string, ScheduleDayGroup>();

  for (const shift of shifts) {
    const group = groups.get(shift.dayKey);

    if (group) {
      group.shifts.push(shift);
      continue;
    }

    groups.set(shift.dayKey, {
      dayKey: shift.dayKey,
      dayLabel: shift.dayLabel,
      dateLabel: shift.dateLabel,
      shifts: [shift],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    shifts: [...group.shifts].sort((left, right) =>
      left.startsAtUtc.localeCompare(right.startsAtUtc),
    ),
  }));
};
