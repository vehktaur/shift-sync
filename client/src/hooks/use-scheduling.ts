"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationFunction,
} from "@tanstack/react-query";

import {
  approveCoverageRequest,
  assignShiftStaff,
  cancelCoverageRequest,
  createShift,
  getCoverageBoard,
  getSchedulingBoard,
  publishShift,
  publishVisibleWeek,
  removeShiftAssignee,
  schedulingQueryKeys,
  unpublishShift,
  unpublishVisibleWeek,
  updateShift,
} from "@/lib/api/scheduling";

const SCHEDULE_REFRESH_INTERVAL_MS = 20_000;

const invalidateSchedulingQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: schedulingQueryKeys.board }),
    queryClient.invalidateQueries({
      queryKey: schedulingQueryKeys.coverageBoard,
    }),
  ]);
};

const useSchedulingMutation = <TData, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await invalidateSchedulingQueries(queryClient);
    },
  });
};

export const useSchedulingBoard = () =>
  useQuery({
    queryKey: schedulingQueryKeys.board,
    queryFn: getSchedulingBoard,
    refetchInterval: SCHEDULE_REFRESH_INTERVAL_MS,
  });

export const useCoverageBoard = () =>
  useQuery({
    queryKey: schedulingQueryKeys.coverageBoard,
    queryFn: getCoverageBoard,
    refetchInterval: SCHEDULE_REFRESH_INTERVAL_MS,
  });

export const useCreateShiftMutation = () => useSchedulingMutation(createShift);

export const useUpdateShiftMutation = () => useSchedulingMutation(updateShift);

export const useAssignShiftStaffMutation = () =>
  useSchedulingMutation(assignShiftStaff);

export const useRemoveShiftAssigneeMutation = () =>
  useSchedulingMutation(removeShiftAssignee);

export const usePublishShiftMutation = () =>
  useSchedulingMutation(publishShift);

export const useUnpublishShiftMutation = () =>
  useSchedulingMutation(unpublishShift);

export const usePublishWeekMutation = () =>
  useSchedulingMutation(publishVisibleWeek);

export const useUnpublishWeekMutation = () =>
  useSchedulingMutation(unpublishVisibleWeek);

export const useApproveCoverageRequestMutation = () =>
  useSchedulingMutation(approveCoverageRequest);

export const useCancelCoverageRequestMutation = () =>
  useSchedulingMutation(cancelCoverageRequest);
