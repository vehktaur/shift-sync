"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptCoverageRequest,
  approveCoverageRequest,
  assignShiftStaff,
  cancelCoverageRequest,
  claimCoverageRequest,
  createDropRequest,
  createShift,
  createSwapRequest,
  getCoverageBoard,
  getCoverageRequestOptions,
  getEligibleStaffForShift,
  getLocations,
  getSchedulingBoard,
  getShiftReferenceData,
  publishShift,
  publishVisibleWeek,
  rejectCoverageRequest,
  removeShiftAssignee,
  schedulingQueryKeys,
  unpublishShift,
  unpublishVisibleWeek,
  updateShift,
  withdrawCoverageRequest,
} from "@/lib/api/scheduling";
import type {
  CoverageBoardResponse,
  CoverageRequestMutationPayload,
  CoverageRequestResponse,
  SchedulingBoardResponse,
  ShiftMutationPayload,
  ShiftResponse,
} from "@/types/scheduling";

const SCHEDULE_REFRESH_INTERVAL_MS = 20_000;

const mergeShiftIntoBoard = (
  board: SchedulingBoardResponse,
  shift: ShiftResponse,
): SchedulingBoardResponse => {
  const existingIndex = board.shifts.findIndex(
    (candidate) => candidate.id === shift.id,
  );
  const shifts =
    existingIndex === -1
      ? [...board.shifts, shift]
      : board.shifts.map((candidate) =>
          candidate.id === shift.id ? shift : candidate,
        );
  const sortedShifts = [...shifts].sort((left, right) =>
    left.startsAtUtc.localeCompare(right.startsAtUtc),
  );

  return {
    ...board,
    shifts: sortedShifts,
  };
};

const updateCoverageRequestInBoard = (
  board: CoverageBoardResponse,
  request: CoverageRequestResponse,
): CoverageBoardResponse => {
  const requests = board.requests
    .map((candidate) => (candidate.id === request.id ? request : candidate))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    ...board,
    requests,
  };
};

const syncShiftBoardCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  shift: ShiftResponse,
  weekStartDate: string,
) => {
  queryClient.setQueryData<SchedulingBoardResponse>(
    schedulingQueryKeys.board(weekStartDate),
    (currentBoard) =>
      currentBoard ? mergeShiftIntoBoard(currentBoard, shift) : currentBoard,
  );
};

const invalidateSchedulingBoardQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) =>
  queryClient.invalidateQueries({
    queryKey: ["scheduling", "board"],
  });

const invalidateCoverageQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  shiftId?: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: schedulingQueryKeys.coverageBoard,
    }),
    invalidateSchedulingBoardQueries(queryClient),
    ...(shiftId
      ? [
          queryClient.invalidateQueries({
            queryKey: schedulingQueryKeys.coverageOptions(shiftId),
          }),
        ]
      : []),
  ]);

const mergeCoverageRequestIntoCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  request: CoverageRequestResponse,
) => {
  queryClient.setQueryData<CoverageBoardResponse>(
    schedulingQueryKeys.coverageBoard,
    (currentBoard) =>
      currentBoard
        ? updateCoverageRequestInBoard(currentBoard, request)
        : currentBoard,
  );
};

export const useSchedulingBoard = (
  weekStartDate: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: schedulingQueryKeys.board(weekStartDate),
    queryFn: async () => getSchedulingBoard(weekStartDate),
    refetchInterval: SCHEDULE_REFRESH_INTERVAL_MS,
    enabled: options?.enabled ?? true,
  });

export const useLocations = () =>
  useQuery({
    queryKey: schedulingQueryKeys.locations,
    queryFn: getLocations,
  });

export const useShiftReferenceData = () =>
  useQuery({
    queryKey: schedulingQueryKeys.referenceData,
    queryFn: getShiftReferenceData,
  });

export const useShiftEligibleStaff = (shiftId: string | null) =>
  useQuery({
    queryKey: shiftId
      ? schedulingQueryKeys.eligibleStaff(shiftId)
      : ["scheduling", "eligible-staff", "idle"],
    queryFn: async () => {
      if (!shiftId) {
        return [];
      }

      return getEligibleStaffForShift(shiftId);
    },
    enabled: Boolean(shiftId),
  });

export const useCoverageBoard = () =>
  useQuery({
    queryKey: schedulingQueryKeys.coverageBoard,
    queryFn: getCoverageBoard,
    refetchInterval: SCHEDULE_REFRESH_INTERVAL_MS,
  });

export const useCoverageRequestOptions = (shiftId: string | null) =>
  useQuery({
    queryKey: shiftId
      ? schedulingQueryKeys.coverageOptions(shiftId)
      : ["coverage", "options", "idle"],
    queryFn: async () => {
      if (!shiftId) {
        return null;
      }

      return getCoverageRequestOptions(shiftId);
    },
    enabled: Boolean(shiftId),
  });

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShift,
    onSuccess: async () => {
      await invalidateSchedulingBoardQueries(queryClient);
    },
  });
};

export const useUpdateShift = (weekStartDate: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShift,
    onSuccess: async (shift) => {
      syncShiftBoardCache(queryClient, shift, weekStartDate);
      await Promise.all([
        invalidateSchedulingBoardQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: schedulingQueryKeys.eligibleStaff(shift.id),
        }),
        invalidateCoverageQueries(queryClient, shift.id),
      ]);
    },
  });
};

export const useAssignStaff = (shiftId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      overrideReason,
    }: {
      staffId: string;
      overrideReason?: string;
    }) => {
      if (!shiftId) {
        throw new Error("Shift must be saved before assigning staff.");
      }

      return assignShiftStaff({ shiftId, staffId, overrideReason });
    },
    onSuccess: async (shift) => {
      await Promise.all([
        invalidateSchedulingBoardQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: schedulingQueryKeys.eligibleStaff(shift.id),
        }),
        invalidateCoverageQueries(queryClient, shift.id),
      ]);
    },
  });
};

export const useRemoveShiftAssignee = (shiftId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      if (!shiftId) {
        throw new Error("Shift must be saved before removing staff.");
      }

      return removeShiftAssignee({ shiftId, staffId });
    },
    onSuccess: async (shift) => {
      await Promise.all([
        invalidateSchedulingBoardQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: schedulingQueryKeys.eligibleStaff(shift.id),
        }),
        invalidateCoverageQueries(queryClient, shift.id),
      ]);
    },
  });
};

export const usePublishShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishShift,
    onSuccess: async () => {
      await invalidateSchedulingBoardQueries(queryClient);
    },
  });
};

export const useUnpublishShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unpublishShift,
    onSuccess: async () => {
      await invalidateSchedulingBoardQueries(queryClient);
    },
  });
};

export const usePublishWeek = (weekStartDate: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => publishVisibleWeek(weekStartDate),
    onSuccess: async (board) => {
      queryClient.setQueryData(schedulingQueryKeys.board(weekStartDate), board);
      await invalidateSchedulingBoardQueries(queryClient);
    },
  });
};

export const useUnpublishWeek = (weekStartDate: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => unpublishVisibleWeek(weekStartDate),
    onSuccess: async (board) => {
      queryClient.setQueryData(schedulingQueryKeys.board(weekStartDate), board);
      await invalidateSchedulingBoardQueries(queryClient);
    },
  });
};

export const useApproveCoverageRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveCoverageRequest,
    onSuccess: async ({ request }) => {
      mergeCoverageRequestIntoCache(queryClient, request);
      await invalidateCoverageQueries(queryClient, request.shift.id);
    },
  });
};

export const useCancelCoverageRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelCoverageRequest,
    onSuccess: async ({ request }) => {
      mergeCoverageRequestIntoCache(queryClient, request);
      await invalidateCoverageQueries(queryClient, request.shift.id);
    },
  });
};

export const useCreateSwapRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CoverageRequestMutationPayload) =>
      createSwapRequest(payload),
    onSuccess: async ({ request }, variables) => {
      mergeCoverageRequestIntoCache(queryClient, request);
      await invalidateCoverageQueries(queryClient, variables.shiftId);
    },
  });
};

export const useCreateDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CoverageRequestMutationPayload) =>
      createDropRequest(payload),
    onSuccess: async ({ request }, variables) => {
      mergeCoverageRequestIntoCache(queryClient, request);
      await invalidateCoverageQueries(queryClient, variables.shiftId);
    },
  });
};

const useCoverageActionMutation = (
  mutationFn: (requestId: string) => Promise<{
    success: true;
    request: CoverageRequestResponse;
  }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async ({ request }) => {
      mergeCoverageRequestIntoCache(queryClient, request);
      await invalidateCoverageQueries(queryClient, request.shift.id);
    },
  });
};

export const useAcceptCoverageRequest = () =>
  useCoverageActionMutation(acceptCoverageRequest);

export const useRejectCoverageRequest = () =>
  useCoverageActionMutation(rejectCoverageRequest);

export const useClaimCoverageRequest = () =>
  useCoverageActionMutation(claimCoverageRequest);

export const useWithdrawCoverageRequest = () =>
  useCoverageActionMutation(withdrawCoverageRequest);

export type ShiftMutationWithIdPayload = ShiftMutationPayload & {
  shiftId: string;
};
