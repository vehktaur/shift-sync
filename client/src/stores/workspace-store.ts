"use client";

import { create } from "zustand";

import {
  getAdjacentWeekStartDate,
  getCurrentWeekStartDate,
} from "@/components/schedule/schedule.utils";

type WorkspaceStoreState = {
  weekStartDate: string;
  setWeekStartDate: (value: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
};

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  weekStartDate: getCurrentWeekStartDate(),
  setWeekStartDate: (value) => set({ weekStartDate: value }),
  goToPreviousWeek: () =>
    set((state) => ({
      weekStartDate: getAdjacentWeekStartDate(state.weekStartDate, -1),
    })),
  goToNextWeek: () =>
    set((state) => ({
      weekStartDate: getAdjacentWeekStartDate(state.weekStartDate, 1),
    })),
  goToCurrentWeek: () =>
    set({
      weekStartDate: getCurrentWeekStartDate(),
    }),
}));
