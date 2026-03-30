"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { ShiftAssignmentPanel } from "@/components/schedule/shift-assignment-panel";
import { ShiftFormPanel } from "@/components/schedule/shift-form-panel";
import { useActiveScheduleShift, useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";
import {
  applyShiftFormError,
  buildDefaultShiftValues,
  toShiftFormValues,
} from "@/components/schedule/schedule.utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  useCreateShift,
  useLocations,
  useShiftReferenceData,
  useUpdateShift,
} from "@/hooks/use-scheduling";
import {
  type ShiftFormInputValues,
  type ShiftFormValues,
  shiftFormSchema,
} from "@/lib/schemas";
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ShiftComposerDialog() {
  const [closeComposer, dialogMode, keepComposerOpenForShift] =
    useScheduleUiStore(
      useShallow((state) => [
        state.closeComposer,
        state.dialogMode,
        state.keepComposerOpenForShift,
      ]),
    );
  const selectedWeekStartDate = useWorkspaceStore((state) => state.weekStartDate);
  const activeShift = useActiveScheduleShift();
  const { scheduleBoard } = useScheduleBoardData();
  const { data: locationsData, isPending: locationsPending } = useLocations();
  const {
    data: shiftReferenceData,
    isPending: shiftReferenceDataPending,
  } = useShiftReferenceData();
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift(selectedWeekStartDate);
  const isComposerOpen = dialogMode !== null;

  const form = useForm<ShiftFormInputValues, unknown, ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: buildDefaultShiftValues({
      defaultLocationId: "",
      defaultSkill: "",
      weekStartDate: selectedWeekStartDate,
    }),
  });

  const locations = locationsData ?? [];
  const skills = shiftReferenceData?.skills ?? [];
  const boardWeekStartDate = selectedWeekStartDate;
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
      : `${mode}:create:${boardWeekStartDate}:${defaultLocationId}:${defaultSkill}`;

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
            weekStartDate: boardWeekStartDate,
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
    boardWeekStartDate,
  ]);

  if (!scheduleBoard || locationsPending || shiftReferenceDataPending) {
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
      <DialogContent
        className="max-h-[92dvh] gap-0 p-0 sm:max-w-5xl"
        data-tour="shift-composer"
      >
        <div className="grid max-h-[92dvh] overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_22rem]">
          <div className="overflow-y-auto border-b border-border/60 lg:border-r lg:border-b-0">
            <ShiftFormPanel
              form={form}
              isSaving={
                createShiftMutation.isPending || updateShiftMutation.isPending
              }
              mode={mode}
              shift={activeShift}
              locations={locations}
              skills={skills}
              weekStartDate={boardWeekStartDate}
              onSubmit={async (values) => {
                const payload = {
                  ...values,
                  title: values.title.trim() ? values.title.trim() : undefined,
                };

                try {
                  const savedShift =
                    mode === "edit" && activeShift
                      ? await updateShiftMutation.mutateAsync({
                          shiftId: activeShift.id,
                          ...payload,
                        })
                      : await createShiftMutation.mutateAsync(payload);

                  keepComposerOpenForShift(savedShift.id);
                  form.clearErrors("root");
                  toast.success(
                    mode === "create"
                      ? `${savedShift.title} created.`
                      : `${savedShift.title} updated.`,
                  );
                } catch (error) {
                  applyShiftFormError(
                    form,
                    error,
                    mode === "create"
                      ? "Unable to create shift."
                      : "Unable to update shift.",
                  );
                }
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
