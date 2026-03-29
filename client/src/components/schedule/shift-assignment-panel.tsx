"use client";

import { useMemo } from "react";
import { AlertTriangle, Trash2, UserPlus } from "lucide-react";

import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import {
  assignmentStatusOrder,
  assignmentStatusVariant,
  formatProjectedHours,
} from "@/components/schedule/schedule.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ShiftAssignmentPanel() {
  const {
    activeShift,
    assignShiftLoading,
    assignStaff,
    assigningStaffId,
    removeAssignee,
    removeAssigneeLoading,
    removingAssigneeId,
  } = useScheduleWorkspace();

  const shift = activeShift;
  const assignmentOptions = useMemo(
    () =>
      [...(shift?.assignmentOptions ?? [])].sort((left, right) => {
        const statusDifference =
          assignmentStatusOrder[left.status] - assignmentStatusOrder[right.status];

        if (statusDifference !== 0) {
          return statusDifference;
        }

        return left.staff.name.localeCompare(right.staff.name);
      }),
    [shift?.assignmentOptions],
  );

  return (
    <div className="space-y-5 p-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Assignments
        </Badge>
        <h3 className="text-base font-semibold tracking-tight">
          {shift ? "Available staff" : "Save to load staff"}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Best matches appear first.
        </p>
      </div>

      {shift ? (
        <>
          <div className="border border-border/70 bg-white/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Current crew
                </p>
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
                    className="flex items-center gap-2 border border-border/70 bg-background/75 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{assignee.name}</p>
                    </div>
                    {shift.canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        loading={
                          removeAssigneeLoading && removingAssigneeId === assignee.id
                        }
                        onClick={() => removeAssignee(assignee.id)}
                      >
                        <Trash2 className="size-3" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            {assignmentOptions.map((option) => {
              const projectedHours = formatProjectedHours(
                option.projectedWeeklyHours,
              );
              const isAssigned = option.status === "assigned";
              const isBlocked = option.status === "blocked";

              return (
                <div
                  key={option.staff.id}
                  className="space-y-3 border border-border/70 bg-white/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {option.staff.name}
                        </p>
                        <Badge variant={assignmentStatusVariant[option.status]}>
                          {option.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.staff.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {option.staff.availabilitySummary}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={
                        isAssigned ? "ghost" : isBlocked ? "outline" : "default"
                      }
                      disabled={!shift.canEdit || isAssigned || isBlocked}
                      loading={
                        assignShiftLoading && assigningStaffId === option.staff.id
                      }
                      onClick={() => assignStaff(option.staff.id)}
                    >
                      <UserPlus className="size-4" />
                      {isAssigned ? "Assigned" : isBlocked ? "Blocked" : "Assign"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">
                      desired {option.staff.desiredHours}h
                    </Badge>
                    <Badge variant="outline">{option.staff.skills.join(", ")}</Badge>
                    {projectedHours ? (
                      <Badge variant="outline">{projectedHours}</Badge>
                    ) : null}
                  </div>

                  {option.message ? (
                    <p className="text-sm leading-6 text-foreground/85">
                      {option.message}
                    </p>
                  ) : null}

                  {option.warningMessages?.length ? (
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
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm leading-6 text-muted-foreground">
          Save the shift to see assignment options.
        </div>
      )}
    </div>
  );
}
