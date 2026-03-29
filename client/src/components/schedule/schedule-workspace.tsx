"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/use-auth";
import {
  useAssignShiftStaffMutation,
  useCreateShiftMutation,
  usePublishShiftMutation,
  usePublishWeekMutation,
  useRemoveShiftAssigneeMutation,
  useSchedulingBoard,
  useUnpublishShiftMutation,
  useUnpublishWeekMutation,
  useUpdateShiftMutation,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import type { ShiftFormValues } from "@/lib/schemas";
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import type {
  SchedulingBoardResponse,
  ShiftResponse,
} from "@/types/scheduling";

import {
  groupShiftsByDay,
  type ScheduleDayGroup,
  type ShiftFilter,
} from "./schedule.utils";

type DialogMode = "create" | "edit" | null;

type ScheduleWorkspaceValue = {
  scheduleBoard: SchedulingBoardResponse | null;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  canManageBoard: boolean;
  locationFilter: string;
  shiftFilter: ShiftFilter;
  groupedShifts: ScheduleDayGroup[];
  dialogMode: DialogMode;
  activeShift: ShiftResponse | null;
  isComposerOpen: boolean;
  setLocationFilter: (value: string) => void;
  setShiftFilter: (value: ShiftFilter) => void;
  openCreateDialog: () => void;
  openEditDialog: (shiftId: string) => void;
  closeComposer: () => void;
  createShiftLoading: boolean;
  updateShiftLoading: boolean;
  assignShiftLoading: boolean;
  assigningStaffId: string | null;
  removeAssigneeLoading: boolean;
  removingAssigneeId: string | null;
  publishShiftLoading: boolean;
  publishingShiftId: string | null;
  unpublishShiftLoading: boolean;
  unpublishingShiftId: string | null;
  publishWeekLoading: boolean;
  unpublishWeekLoading: boolean;
  submitShift: (
    values: ShiftFormValues,
    onError: (error: unknown) => void,
  ) => void;
  assignStaff: (staffId: string) => void;
  removeAssignee: (staffId: string) => void;
  togglePublishShift: (shift: ShiftResponse) => void;
  publishWeek: () => void;
  unpublishWeek: () => void;
};

const ScheduleWorkspaceContext = createContext<ScheduleWorkspaceValue | null>(
  null,
);

export function ScheduleWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const currentUserQuery = useCurrentUser();
  const schedulingBoardQuery = useSchedulingBoard();
  const createShiftMutation = useCreateShiftMutation();
  const updateShiftMutation = useUpdateShiftMutation();
  const assignShiftStaffMutation = useAssignShiftStaffMutation();
  const removeShiftAssigneeMutation = useRemoveShiftAssigneeMutation();
  const publishShiftMutation = usePublishShiftMutation();
  const unpublishShiftMutation = useUnpublishShiftMutation();
  const publishWeekMutation = usePublishWeekMutation();
  const unpublishWeekMutation = useUnpublishWeekMutation();

  const locationFilter = useScheduleUiStore((state) => state.locationFilter);
  const shiftFilter = useScheduleUiStore((state) => state.shiftFilter);
  const dialogMode = useScheduleUiStore((state) => state.dialogMode);
  const activeShiftId = useScheduleUiStore((state) => state.activeShiftId);
  const setLocationFilter = useScheduleUiStore((state) => state.setLocationFilter);
  const setShiftFilter = useScheduleUiStore((state) => state.setShiftFilter);
  const openCreateDialog = useScheduleUiStore((state) => state.openCreateDialog);
  const openEditDialog = useScheduleUiStore((state) => state.openEditDialog);
  const closeComposer = useScheduleUiStore((state) => state.closeComposer);

  const scheduleBoard = schedulingBoardQuery.data ?? null;
  const canManageBoard =
    currentUserQuery.data?.user.role === "admin" ||
    currentUserQuery.data?.user.role === "manager";

  const filteredShifts = useMemo(() => {
    if (!scheduleBoard) {
      return [];
    }

    return scheduleBoard.shifts.filter((shift) => {
      if (locationFilter !== "all" && shift.location.id !== locationFilter) {
        return false;
      }

      if (shiftFilter === "open") {
        return shift.openSlots > 0;
      }

      if (shiftFilter === "risk") {
        return (
          shift.state === "warning" ||
          shift.state === "blocked" ||
          shift.state === "pending"
        );
      }

      return true;
    });
  }, [locationFilter, scheduleBoard, shiftFilter]);

  const groupedShifts = useMemo(
    () => groupShiftsByDay(filteredShifts),
    [filteredShifts],
  );

  const activeShift =
    scheduleBoard?.shifts.find((shift) => shift.id === activeShiftId) ?? null;

  const retry = useCallback(() => {
    void schedulingBoardQuery.refetch();
  }, [schedulingBoardQuery]);

  const assignStaff = useCallback(
    (staffId: string) => {
      if (!activeShift) {
        return;
      }

      const staffName =
        activeShift.assignmentOptions.find(
          (option) => option.staff.id === staffId,
        )?.staff.name ?? "Staff member";

      assignShiftStaffMutation.mutate(
        { shiftId: activeShift.id, staffId },
        {
          onSuccess: () => {
            toast.success(`${staffName} assigned to ${activeShift.title}.`);
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Unable to assign staff."));
          },
        },
      );
    },
    [activeShift, assignShiftStaffMutation],
  );

  const removeAssignee = useCallback(
    (staffId: string) => {
      if (!activeShift) {
        return;
      }

      const staffName =
        activeShift.assignees.find((assignee) => assignee.id === staffId)
          ?.name ?? "Staff member";

      removeShiftAssigneeMutation.mutate(
        { shiftId: activeShift.id, staffId },
        {
          onSuccess: () => {
            toast.success(`${staffName} removed.`);
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Unable to remove assignee."));
          },
        },
      );
    },
    [activeShift, removeShiftAssigneeMutation],
  );

  const togglePublishShift = useCallback(
    (shift: ShiftResponse) => {
      const mutation = shift.published
        ? unpublishShiftMutation
        : publishShiftMutation;

      mutation.mutate(shift.id, {
        onSuccess: () => {
          toast.success(
            shift.published
              ? `${shift.title} moved to draft.`
              : `${shift.title} published.`,
          );
        },
        onError: (error) => {
          toast.error(
            getApiErrorMessage(
              error,
              shift.published
                ? "Unable to unpublish shift."
                : "Unable to publish shift.",
            ),
          );
        },
      });
    },
    [publishShiftMutation, unpublishShiftMutation],
  );

  const publishWeek = useCallback(() => {
    publishWeekMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Week published.");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Unable to publish week."));
      },
    });
  }, [publishWeekMutation]);

  const unpublishWeek = useCallback(() => {
    unpublishWeekMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Week moved to draft.");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Unable to unpublish week."));
      },
    });
  }, [unpublishWeekMutation]);

  const submitShift = useCallback(
    (values: ShiftFormValues, onError: (error: unknown) => void) => {
      const payload = {
        ...values,
        title: values.title.trim() ? values.title.trim() : undefined,
      };

      if (dialogMode === "edit" && activeShift) {
        updateShiftMutation.mutate(
          {
            shiftId: activeShift.id,
            ...payload,
          },
          {
            onSuccess: (updatedShift) => {
              toast.success(`${updatedShift.title} updated.`);
              closeComposer();
            },
            onError,
          },
        );
        return;
      }

      createShiftMutation.mutate(payload, {
        onSuccess: (createdShift) => {
          toast.success(`${createdShift.title} created.`);
          closeComposer();
        },
        onError,
      });
    },
    [activeShift, closeComposer, createShiftMutation, dialogMode, updateShiftMutation],
  );

  const value = useMemo<ScheduleWorkspaceValue>(
    () => ({
      scheduleBoard,
      isLoading: schedulingBoardQuery.isLoading,
      isError: schedulingBoardQuery.isError || !scheduleBoard,
      retry,
      canManageBoard,
      locationFilter,
      shiftFilter,
      groupedShifts,
      dialogMode,
      activeShift,
      isComposerOpen: dialogMode !== null,
      setLocationFilter,
      setShiftFilter,
      openCreateDialog,
      openEditDialog,
      closeComposer,
      createShiftLoading: createShiftMutation.isPending,
      updateShiftLoading: updateShiftMutation.isPending,
      assignShiftLoading: assignShiftStaffMutation.isPending,
      assigningStaffId: assignShiftStaffMutation.isPending
        ? assignShiftStaffMutation.variables?.staffId ?? null
        : null,
      removeAssigneeLoading: removeShiftAssigneeMutation.isPending,
      removingAssigneeId: removeShiftAssigneeMutation.isPending
        ? removeShiftAssigneeMutation.variables?.staffId ?? null
        : null,
      publishShiftLoading: publishShiftMutation.isPending,
      publishingShiftId: publishShiftMutation.isPending
        ? publishShiftMutation.variables ?? null
        : null,
      unpublishShiftLoading: unpublishShiftMutation.isPending,
      unpublishingShiftId: unpublishShiftMutation.isPending
        ? unpublishShiftMutation.variables ?? null
        : null,
      publishWeekLoading: publishWeekMutation.isPending,
      unpublishWeekLoading: unpublishWeekMutation.isPending,
      submitShift,
      assignStaff,
      removeAssignee,
      togglePublishShift,
      publishWeek,
      unpublishWeek,
    }),
    [
      activeShift,
      assignShiftStaffMutation.isPending,
      assignShiftStaffMutation.variables,
      canManageBoard,
      closeComposer,
      createShiftMutation.isPending,
      dialogMode,
      groupedShifts,
      locationFilter,
      openCreateDialog,
      openEditDialog,
      publishShiftMutation.isPending,
      publishShiftMutation.variables,
      publishWeek,
      publishWeekMutation.isPending,
      removeAssignee,
      removeShiftAssigneeMutation.isPending,
      removeShiftAssigneeMutation.variables,
      retry,
      scheduleBoard,
      schedulingBoardQuery.isError,
      schedulingBoardQuery.isLoading,
      setLocationFilter,
      setShiftFilter,
      shiftFilter,
      submitShift,
      togglePublishShift,
      unpublishShiftMutation.isPending,
      unpublishShiftMutation.variables,
      unpublishWeek,
      unpublishWeekMutation.isPending,
      updateShiftMutation.isPending,
      assignStaff,
    ],
  );

  return (
    <ScheduleWorkspaceContext.Provider value={value}>
      {children}
    </ScheduleWorkspaceContext.Provider>
  );
}

export function useScheduleWorkspace() {
  const value = useContext(ScheduleWorkspaceContext);

  if (!value) {
    throw new Error(
      "useScheduleWorkspace must be used within ScheduleWorkspaceProvider.",
    );
  }

  return value;
}
