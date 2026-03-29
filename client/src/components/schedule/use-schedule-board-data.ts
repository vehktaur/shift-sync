"use client";

import { useMemo } from "react";

import { useCurrentUser } from "@/hooks/use-auth";
import { useSchedulingBoard } from "@/hooks/use-scheduling";
import { useScheduleStore } from "@/stores/schedule-store";

import {
  buildPublishBlockers,
  buildScheduleBoardSummary,
  groupShiftsByDay,
} from "./schedule.utils";

export const useScheduleBoardData = () => {
  const currentUserQuery = useCurrentUser();
  const locationFilter = useScheduleStore((state) => state.locationFilter);
  const shiftFilter = useScheduleStore((state) => state.shiftFilter);
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const schedulingBoardQuery = useSchedulingBoard(weekStartDate);
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
    isLoading: schedulingBoardQuery.isLoading,
    isError: schedulingBoardQuery.isError || !scheduleBoard,
    retry: () => {
      void schedulingBoardQuery.refetch();
    },
  };
};

export const useActiveScheduleShift = () => {
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const openShiftId = useScheduleStore((state) => state.openShiftId);
  const scheduleBoard = useSchedulingBoard(weekStartDate).data ?? null;

  return useMemo(
    () =>
      scheduleBoard?.shifts.find((shift) => shift.id === openShiftId) ?? null,
    [openShiftId, scheduleBoard],
  );
};
