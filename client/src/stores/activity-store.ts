"use client";

import { create } from "zustand";

import {
  getCurrentWeekStartDate,
  getWeekEndDate,
} from "@/components/schedule/schedule.utils";

const currentWeekStartDate = getCurrentWeekStartDate();

// Activity keeps its export controls separate from the shared workspace week so
// admins can inspect one week while exporting a different date range if needed.
type ActivityStoreState = {
  selectedShiftId: string;
  exportStartDate: string;
  exportEndDate: string;
  exportLocationId: string;
  setSelectedShiftId: (value: string) => void;
  setExportStartDate: (value: string) => void;
  setExportEndDate: (value: string) => void;
  setExportLocationId: (value: string) => void;
  syncExportRangeToWeek: (weekStartDate: string) => void;
};

export const useActivityStore = create<ActivityStoreState>((set) => ({
  selectedShiftId: "",
  exportStartDate: currentWeekStartDate,
  exportEndDate: getWeekEndDate(currentWeekStartDate),
  exportLocationId: "all",
  setSelectedShiftId: (value) => set({ selectedShiftId: value }),
  setExportStartDate: (value) => set({ exportStartDate: value }),
  setExportEndDate: (value) => set({ exportEndDate: value }),
  setExportLocationId: (value) => set({ exportLocationId: value }),
  syncExportRangeToWeek: (weekStartDate) =>
    set({
      exportStartDate: weekStartDate,
      exportEndDate: getWeekEndDate(weekStartDate),
    }),
}));
