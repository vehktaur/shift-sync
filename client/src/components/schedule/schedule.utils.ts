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
  AssignmentOptionResponse,
  ShiftResponse,
  ShiftState,
} from "@/types/scheduling";

export type ShiftFilter = "all" | "open" | "risk";

export const shiftFilters: Array<{ label: string; value: ShiftFilter }> = [
  { label: "All shifts", value: "all" },
  { label: "Open shifts", value: "open" },
  { label: "Warnings", value: "risk" },
];

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

export const assignmentStatusVariant: Record<
  AssignmentOptionResponse["status"],
  "default" | "warning" | "critical" | "neutral" | "success"
> = {
  assigned: "success",
  available: "default",
  warning: "warning",
  blocked: "critical",
};

export const assignmentStatusOrder: Record<
  AssignmentOptionResponse["status"],
  number
> = {
  assigned: 0,
  available: 1,
  warning: 2,
  blocked: 3,
};

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
  typeof hours === "number" ? `${hours.toFixed(1)}h projected` : null;

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
