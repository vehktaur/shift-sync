import { apiClient } from "@/lib/api/client";
import type {
  CoverageActionResponse,
  CoverageBoardResponse,
  SchedulingBoardResponse,
  ShiftAssignmentPayload,
  ShiftAssigneeRemovalPayload,
  ShiftMutationPayload,
  ShiftResponse,
} from "@/types/scheduling";

export const schedulingQueryKeys = {
  board: ["scheduling", "board"] as const,
  coverageBoard: ["coverage", "board"] as const,
};

export const getSchedulingBoard = async () => {
  const { data } = await apiClient.get<SchedulingBoardResponse>("/shifts/board");
  return data;
};

export const createShift = async (payload: ShiftMutationPayload) => {
  const { data } = await apiClient.post<ShiftResponse>("/shifts", payload);
  return data;
};

export const updateShift = async ({
  shiftId,
  ...payload
}: ShiftMutationPayload & { shiftId: string }) => {
  const { data } = await apiClient.patch<ShiftResponse>(
    `/shifts/${shiftId}`,
    payload,
  );
  return data;
};

export const assignShiftStaff = async ({
  shiftId,
  staffId,
}: ShiftAssignmentPayload) => {
  const { data } = await apiClient.post<ShiftResponse>(
    `/shifts/${shiftId}/assignments`,
    { staffId },
  );
  return data;
};

export const removeShiftAssignee = async ({
  shiftId,
  staffId,
}: ShiftAssigneeRemovalPayload) => {
  const { data } = await apiClient.delete<ShiftResponse>(
    `/shifts/${shiftId}/assignments/${staffId}`,
  );
  return data;
};

export const publishShift = async (shiftId: string) => {
  const { data } = await apiClient.post<ShiftResponse>(
    `/shifts/${shiftId}/publish`,
  );
  return data;
};

export const unpublishShift = async (shiftId: string) => {
  const { data } = await apiClient.post<ShiftResponse>(
    `/shifts/${shiftId}/unpublish`,
  );
  return data;
};

export const publishVisibleWeek = async () => {
  const { data } = await apiClient.post<SchedulingBoardResponse>(
    "/shifts/actions/publish-week",
  );
  return data;
};

export const unpublishVisibleWeek = async () => {
  const { data } = await apiClient.post<SchedulingBoardResponse>(
    "/shifts/actions/unpublish-week",
  );
  return data;
};

export const getCoverageBoard = async () => {
  const { data } = await apiClient.get<CoverageBoardResponse>("/coverage/board");
  return data;
};

export const approveCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/approve`,
  );
  return data;
};

export const cancelCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/cancel`,
  );
  return data;
};
