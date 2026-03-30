"use client";

import { create } from "zustand";

import type { ShiftFilter } from "@/components/schedule/schedule.utils";

type DialogMode = "create" | "edit" | null;

// Schedule-only UI state. This keeps board filters and composer visibility
// out of local component state so the schedule surface behaves consistently.
type ScheduleUiStoreState = {
  locationFilter: string;
  shiftFilter: ShiftFilter;
  dialogMode: DialogMode;
  openShiftId: string | null;
  setLocationFilter: (value: string) => void;
  setShiftFilter: (value: ShiftFilter) => void;
  openCreateDialog: () => void;
  openEditDialog: (shiftId: string) => void;
  setOpenShiftId: (shiftId: string | null) => void;
  keepComposerOpenForShift: (shiftId: string) => void;
  closeComposer: () => void;
};

export const useScheduleUiStore = create<ScheduleUiStoreState>((set) => ({
  locationFilter: "all",
  shiftFilter: "all",
  dialogMode: null,
  openShiftId: null,
  setLocationFilter: (value) => set({ locationFilter: value }),
  setShiftFilter: (value) => set({ shiftFilter: value }),
  openCreateDialog: () => set({ dialogMode: "create", openShiftId: null }),
  openEditDialog: (shiftId) => set({ dialogMode: "edit", openShiftId: shiftId }),
  setOpenShiftId: (shiftId) => set({ openShiftId: shiftId }),
  keepComposerOpenForShift: (shiftId) =>
    set({ dialogMode: "edit", openShiftId: shiftId }),
  closeComposer: () => set({ dialogMode: null, openShiftId: null }),
}));
