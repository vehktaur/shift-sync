"use client";

import { useMemo } from "react";

import { useSession } from "@/hooks/use-auth";
import { useSchedulingBoard } from "@/hooks/use-scheduling";
import { useScheduleStore } from "@/stores/schedule-store";

import {
  buildPublishBlockers,
  buildScheduleBoardSummary,
  groupShiftsByDay,
} from "./schedule.utils";

export const useScheduleBoardData = () => {
  const { data: session } = useSession();
  const locationFilter = useScheduleStore((state) => state.locationFilter);
  const shiftFilter = useScheduleStore((state) => state.shiftFilter);
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const {
    data: scheduleBoard,
    isPending: scheduleBoardPending,
    isError: scheduleBoardError,
    refetch: refetchScheduleBoard,
  } = useSchedulingBoard(weekStartDate);

  const canManageBoard =
    session?.user.role === "admin" ||
    session?.user.role === "manager";

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
  const scheduleSummary = useMemo(
    () => buildScheduleBoardSummary(scheduleBoard?.shifts ?? []),
    [scheduleBoard?.shifts],
  );
  const publishBlockers = useMemo(
    () => buildPublishBlockers(scheduleBoard?.shifts ?? []),
    [scheduleBoard?.shifts],
  );

  return {
    scheduleBoard,
    groupedShifts,
    scheduleSummary,
    publishBlockers,
    canManageBoard,
    weekStartDate,
    isLoading: scheduleBoardPending,
    isError: scheduleBoardError || !scheduleBoard,
    retry: () => {
      void refetchScheduleBoard();
    },
  };
};

export const useActiveScheduleShift = () => {
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const openShiftId = useScheduleStore((state) => state.openShiftId);
  const { data: scheduleBoard } = useSchedulingBoard(weekStartDate);

  return useMemo(
    () =>
      scheduleBoard?.shifts.find((shift) => shift.id === openShiftId) ?? null,
    [openShiftId, scheduleBoard],
  );
};
