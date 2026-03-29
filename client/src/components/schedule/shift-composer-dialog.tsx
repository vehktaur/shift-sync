"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ShiftAssignmentPanel } from "@/components/schedule/shift-assignment-panel";
import { ShiftFormPanel } from "@/components/schedule/shift-form-panel";
import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import {
  applyShiftFormError,
  buildDefaultShiftValues,
  toShiftFormValues,
} from "@/components/schedule/schedule.utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type ShiftFormInputValues,
  type ShiftFormValues,
  shiftFormSchema,
} from "@/lib/schemas";

export function ShiftComposerDialog() {
  const {
    activeShift,
    closeComposer,
    dialogMode,
    isComposerOpen,
    scheduleBoard,
    submitShift,
  } = useScheduleWorkspace();

  const form = useForm<ShiftFormInputValues, unknown, ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: buildDefaultShiftValues({
      defaultLocationId: "",
      defaultSkill: "",
      weekStartDate: "2026-03-30",
    }),
  });

  const locations = scheduleBoard?.locations ?? [];
  const skills = scheduleBoard?.skills ?? [];
  const weekStartDate = scheduleBoard?.weekStartDate ?? "2026-03-30";
  const mode = dialogMode ?? "create";
  const defaultLocationId = locations[0]?.id ?? "";
  const defaultSkill = skills[0] ?? "";
  const lastResetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isComposerOpen) {
      lastResetKeyRef.current = null;
      return;
    }

    // Scheduling data polls in the background, so only reset when the dialog
    // identity changes instead of wiping in-progress edits on every refetch.
    const resetKey = activeShift
      ? `${mode}:${activeShift.id}`
      : `${mode}:create:${weekStartDate}:${defaultLocationId}:${defaultSkill}`;

    if (lastResetKeyRef.current === resetKey) {
      return;
    }

    lastResetKeyRef.current = resetKey;
    form.reset(
      activeShift
        ? toShiftFormValues(activeShift)
        : buildDefaultShiftValues({
            defaultLocationId,
            defaultSkill,
            weekStartDate,
          }),
    );
    form.clearErrors();
  }, [
    activeShift,
    defaultLocationId,
    defaultSkill,
    form,
    isComposerOpen,
    mode,
    weekStartDate,
  ]);

  if (!scheduleBoard) {
    return null;
  }

  return (
    <Dialog
      open={isComposerOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeComposer();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="grid max-h-[92vh] overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_22rem]">
          <div className="overflow-y-auto border-b border-border/60 lg:border-r lg:border-b-0">
            <ShiftFormPanel
              form={form}
              onSubmit={(values) => {
                submitShift(values, (error) => {
                  applyShiftFormError(
                    form,
                    error,
                    mode === "create"
                      ? "Unable to create shift."
                      : "Unable to update shift.",
                  );
                });
              }}
            />
          </div>

          <div className="overflow-y-auto bg-muted/20">
            <ShiftAssignmentPanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
