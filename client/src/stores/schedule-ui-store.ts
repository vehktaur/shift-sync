"use client";

import { create } from "zustand";

import type { ShiftFilter } from "@/components/schedule/schedule.utils";

type DialogMode = "create" | "edit" | null;

type ScheduleUiState = {
  locationFilter: string;
  shiftFilter: ShiftFilter;
  dialogMode: DialogMode;
  activeShiftId: string | null;
  setLocationFilter: (value: string) => void;
  setShiftFilter: (value: ShiftFilter) => void;
  openCreateDialog: () => void;
  openEditDialog: (shiftId: string) => void;
  closeComposer: () => void;
};

export const useScheduleUiStore = create<ScheduleUiState>((set) => ({
  locationFilter: "all",
  shiftFilter: "all",
  dialogMode: null,
  activeShiftId: null,
  setLocationFilter: (value) => set({ locationFilter: value }),
  setShiftFilter: (value) => set({ shiftFilter: value }),
  openCreateDialog: () => set({ dialogMode: "create", activeShiftId: null }),
  openEditDialog: (shiftId) =>
    set({ dialogMode: "edit", activeShiftId: shiftId }),
  closeComposer: () => set({ dialogMode: null, activeShiftId: null }),
}));
