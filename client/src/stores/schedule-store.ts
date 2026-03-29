"use client";

import { create } from "zustand";

import {
  getAdjacentWeekStartDate,
  getCurrentWeekStartDate,
  type ShiftFilter,
} from "@/components/schedule/schedule.utils";

type DialogMode = "create" | "edit" | null;

type ScheduleStoreState = {
  locationFilter: string;
  shiftFilter: ShiftFilter;
  weekStartDate: string;
  dialogMode: DialogMode;
  openShiftId: string | null;
  setLocationFilter: (value: string) => void;
  setShiftFilter: (value: ShiftFilter) => void;
  setWeekStartDate: (value: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  openCreateDialog: () => void;
  openEditDialog: (shiftId: string) => void;
  setOpenShiftId: (shiftId: string | null) => void;
  keepComposerOpenForShift: (shiftId: string) => void;
  closeComposer: () => void;
};

export const useScheduleStore = create<ScheduleStoreState>((set) => ({
  locationFilter: "all",
  shiftFilter: "all",
  weekStartDate: getCurrentWeekStartDate(),
  dialogMode: null,
  openShiftId: null,
  setLocationFilter: (value) => set({ locationFilter: value }),
  setShiftFilter: (value) => set({ shiftFilter: value }),
  setWeekStartDate: (value) => set({ weekStartDate: value }),
  goToPreviousWeek: () =>
    set((state) => ({
      weekStartDate: getAdjacentWeekStartDate(state.weekStartDate, -1),
      openShiftId: null,
      dialogMode: null,
    })),
  goToNextWeek: () =>
    set((state) => ({
      weekStartDate: getAdjacentWeekStartDate(state.weekStartDate, 1),
      openShiftId: null,
      dialogMode: null,
    })),
  goToCurrentWeek: () =>
    set({
      weekStartDate: getCurrentWeekStartDate(),
      openShiftId: null,
      dialogMode: null,
    }),
  openCreateDialog: () => set({ dialogMode: "create", openShiftId: null }),
  openEditDialog: (shiftId) => set({ dialogMode: "edit", openShiftId: shiftId }),
  setOpenShiftId: (shiftId) => set({ openShiftId: shiftId }),
  keepComposerOpenForShift: (shiftId) =>
    set({ dialogMode: "edit", openShiftId: shiftId }),
  closeComposer: () => set({ dialogMode: null, openShiftId: null }),
}));
