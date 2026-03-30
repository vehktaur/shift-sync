"use client";

import { useState } from "react";
import axios from "axios";
import { AlertTriangle, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  formatProjectedHours,
  getProjectedHoursExplanation,
  getShiftEditLockReason,
} from "@/components/schedule/schedule.utils";
import { useActiveScheduleShift } from "@/components/schedule/use-schedule-board-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAssignStaff,
  useRemoveShiftAssignee,
  useShiftEligibleStaff,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import type { ApiErrorResponse } from "@/types/auth";
import type {
  AssignmentViolationResponse,
  EligibleStaffResponse,
} from "@/types/scheduling";

// Assignment management for the currently opened shift, including the
// consecutive-day override flow when a manager needs to justify an assignment.
const AssignmentPanelSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="space-y-3 border border-border/70 bg-white/80 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    ))}
  </div>
);

export function ShiftAssignmentPanel() {
  const [overrideCandidate, setOverrideCandidate] =
    useState<EligibleStaffResponse["staff"] | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const shift = useActiveScheduleShift();
  const {
    data: eligibleStaff,
    isPending: eligibleStaffPending,
    isError: eligibleStaffError,
  } = useShiftEligibleStaff(shift?.id ?? null);
  const {
    mutateAsync: assignStaff,
    isPending: assigningStaff,
    variables: assigningStaffPayload,
  } = useAssignStaff(shift?.id ?? null);
  const {
    mutateAsync: removeAssignee,
    isPending: removingAssignee,
    variables: removingAssigneeId,
  } = useRemoveShiftAssignee(shift?.id ?? null);
  const assignLockReason = getShiftEditLockReason("assign");
  const projectedHoursExplanation = getProjectedHoursExplanation();

  const handleAssign = async (staff: EligibleStaffResponse["staff"]) => {
    try {
      await assignStaff({ staffId: staff.id });
      toast.success(`${staff.name} assigned to ${shift?.title ?? "the shift"}.`);
    } catch (error) {
      if (
        axios.isAxiosError<AssignmentViolationResponse | ApiErrorResponse>(error) &&
        error.response?.data &&
        "violatedRule" in error.response.data &&
        error.response.data.violatedRule ===
          "seventh_consecutive_day_override_required"
      ) {
        setOverrideCandidate(staff);
        setOverrideReason("");
        toast.error(error.response.data.message);
        return;
      }

      toast.error(getApiErrorMessage(error, "Unable to assign staff."));
    }
  };

  return (
    <>
      <div className="space-y-5 p-6" data-tour="shift-assignment-panel">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Assignments
          </Badge>
          <h3 className="text-base font-semibold tracking-tight">
            {shift ? "Eligible staff for this shift" : "Save the shift first"}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Staff who match this shift. The hours badge shows what each
            person&apos;s total for the selected week would be after taking this
            shift.
          </p>
          {shift && !shift.canEdit && shift.canManageAssignments && (
            <p className="text-sm leading-6 text-muted-foreground">
              Shift details are locked because the cutoff window has passed, but
              you can still finish staffing it until the shift starts.
            </p>
          )}
          {shift && !shift.canManageAssignments && (
            <p className="text-sm leading-6 text-muted-foreground">
              This shift has already started. People can still appear here
              because they fit the shift, but assignments can no longer be
              changed.
            </p>
          )}
        </div>

        {shift && (
          <>
            <div className="border border-border/70 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Current crew
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {shift.assignees.length} assigned • {shift.openSlots} open
                  </p>
                </div>
                <Badge variant={shift.openSlots > 0 ? "warning" : "success"}>
                  {shift.openSlots > 0 ? "Open" : "Covered"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {shift.assignees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nobody assigned yet.
                  </p>
                ) : (
                  shift.assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center gap-2 border border-border/70 bg-background/75 px-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{assignee.name}</p>
                      </div>
                      {shift.canManageAssignments && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={
                            removingAssignee && removingAssigneeId === assignee.id
                          }
                          onClick={async () => {
                            try {
                              await removeAssignee(assignee.id);
                              toast.success(`${assignee.name} removed.`);
                            } catch (error) {
                              toast.error(
                                getApiErrorMessage(
                                  error,
                                  "Unable to remove assignee.",
                                ),
                              );
                            }
                          }}
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {eligibleStaffPending ? (
              <AssignmentPanelSkeleton />
            ) : eligibleStaffError ? (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm leading-6 text-muted-foreground">
                Unable to load available staff right now.
              </div>
            ) : eligibleStaff && eligibleStaff.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-60 pe-2 -me-5">
                {eligibleStaff.map((option) => {
                  const projectedHours = formatProjectedHours(
                    option.projectedWeeklyHours,
                  );

                  return (
                    <div
                      key={option.staff.id}
                      className="space-y-3 border border-border/70 bg-white/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {option.staff.name}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {option.staff.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {option.staff.availabilitySummary}
                          </p>
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={shift.canManageAssignments ? -1 : 0}
                            >
                              <Button
                                type="button"
                                size="xs"
                                loading={
                                  assigningStaff &&
                                  assigningStaffPayload?.staffId === option.staff.id
                                }
                                disabled={!shift.canManageAssignments}
                                onClick={() => {
                                  void handleAssign(option.staff);
                                }}
                              >
                                <UserPlus className="size-4" />
                                Assign
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!shift.canManageAssignments && (
                            <TooltipContent>{assignLockReason}</TooltipContent>
                          )}
                        </Tooltip>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          Target hours: {option.staff.desiredHours}h
                        </Badge>
                        <Badge variant="outline">
                          Skills: {option.staff.skills.join(", ")}
                        </Badge>
                        {projectedHours && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline">{projectedHours}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {projectedHoursExplanation}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {option.warningMessages.length > 0 && (
                        <div className="space-y-2">
                          {option.warningMessages.map((warning) => (
                            <div
                              key={warning}
                              className="flex gap-2 border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm leading-6 text-amber-900"
                            >
                              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm leading-6 text-muted-foreground">
                No eligible staff match this shift yet.
              </div>
            )}
          </>
        )}
        {!shift && (
          <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm leading-6 text-muted-foreground">
            Save the shift to see eligible staff.
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(overrideCandidate)}
        onOpenChange={(open) => {
          if (!open) {
            setOverrideCandidate(null);
            setOverrideReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <Badge variant="warning" className="w-fit">
              Override required
            </Badge>
            <DialogTitle>7th consecutive day</DialogTitle>
            <DialogDescription>
              A manager reason is required before assigning{" "}
              {overrideCandidate?.name ?? "this staff member"} to a 7th
              consecutive day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="override-reason"
              className="text-sm font-medium text-foreground"
            >
              Override reason
            </label>
            <Input
              id="override-reason"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Document why this assignment is still necessary"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOverrideCandidate(null);
                setOverrideReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              loading={
                assigningStaff &&
                assigningStaffPayload?.staffId === overrideCandidate?.id
              }
              onClick={async () => {
                if (!overrideCandidate || !shift) {
                  return;
                }

                if (!overrideReason.trim()) {
                  toast.error("Enter a reason before applying the override.");
                  return;
                }

                try {
                  await assignStaff({
                    staffId: overrideCandidate.id,
                    overrideReason: overrideReason.trim(),
                  });
                  toast.success(
                    `${overrideCandidate.name} assigned to ${shift.title} with override.`,
                  );
                  setOverrideCandidate(null);
                  setOverrideReason("");
                } catch (error) {
                  toast.error(
                    getApiErrorMessage(error, "Unable to apply override."),
                  );
                }
              }}
            >
              Apply override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
