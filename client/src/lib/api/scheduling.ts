import { apiClient } from "@/lib/api/client";
import type {
  CoverageActionResponse,
  CoverageBoardResponse,
  CoverageRequestMutationPayload,
  CoverageRequestOptionsResponse,
  EligibleStaffResponse,
  ScheduleLocationResponse,
  SchedulingBoardResponse,
  ShiftDeletionResponse,
  ShiftReferenceDataResponse,
  ShiftAssignmentPayload,
  ShiftAssigneeRemovalPayload,
  ShiftMutationPayload,
  ShiftResponse,
} from "@/types/scheduling";

export const schedulingQueryKeys = {
  board: (weekStartDate: string) =>
    ["scheduling", "board", weekStartDate] as const,
  locations: ["scheduling", "locations"] as const,
  referenceData: ["scheduling", "reference-data"] as const,
  eligibleStaff: (shiftId: string) =>
    ["scheduling", "eligible-staff", shiftId] as const,
  coverageBoard: ["coverage", "board"] as const,
  coverageOptions: (shiftId: string) =>
    ["coverage", "options", shiftId] as const,
};

export const getSchedulingBoard = async (weekStartDate: string) => {
  const { data } = await apiClient.get<SchedulingBoardResponse>("/shifts/board", {
    params: { weekStart: weekStartDate },
  });
  return data;
};

export const getLocations = async () => {
  const { data } =
    await apiClient.get<ScheduleLocationResponse[]>("/locations");
  return data;
};

export const getShiftReferenceData = async () => {
  const { data } =
    await apiClient.get<ShiftReferenceDataResponse>("/shifts/reference-data");
  return data;
};

export const createShift = async (payload: ShiftMutationPayload) => {
  const { data } = await apiClient.post<ShiftResponse>("/shifts", payload);
  return data;
};

export const getEligibleStaffForShift = async (shiftId: string) => {
  const { data } = await apiClient.get<EligibleStaffResponse[]>(
    `/shifts/${shiftId}/eligible-staff`,
  );
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

export const deleteShift = async (shiftId: string) => {
  const { data } = await apiClient.delete<ShiftDeletionResponse>(
    `/shifts/${shiftId}`,
  );
  return data;
};

export const assignShiftStaff = async ({
  shiftId,
  staffId,
  overrideReason,
}: ShiftAssignmentPayload) => {
  const { data } = await apiClient.post<ShiftResponse>(
    `/shifts/${shiftId}/assignments`,
    { staffId, overrideReason },
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

export const publishVisibleWeek = async (weekStartDate: string) => {
  const { data } = await apiClient.post<SchedulingBoardResponse>(
    "/shifts/actions/publish-week",
    undefined,
    {
      params: { weekStart: weekStartDate },
    },
  );
  return data;
};

export const unpublishVisibleWeek = async (weekStartDate: string) => {
  const { data } = await apiClient.post<SchedulingBoardResponse>(
    "/shifts/actions/unpublish-week",
    undefined,
    {
      params: { weekStart: weekStartDate },
    },
  );
  return data;
};

export const getCoverageBoard = async () => {
  const { data } = await apiClient.get<CoverageBoardResponse>("/coverage/board");
  return data;
};

export const getCoverageRequestOptions = async (shiftId: string) => {
  const { data } = await apiClient.get<CoverageRequestOptionsResponse>(
    `/coverage/shifts/${shiftId}/options`,
  );
  return data;
};

export const createSwapRequest = async (
  payload: CoverageRequestMutationPayload,
) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    "/coverage/requests/swap",
    payload,
  );
  return data;
};

export const createDropRequest = async (
  payload: CoverageRequestMutationPayload,
) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    "/coverage/requests/drop",
    payload,
  );
  return data;
};

export const approveCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/approve`,
  );
  return data;
};

export const acceptCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/accept`,
  );
  return data;
};

export const rejectCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/reject`,
  );
  return data;
};

export const claimCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/claim`,
  );
  return data;
};

export const withdrawCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/withdraw`,
  );
  return data;
};

export const cancelCoverageRequest = async (requestId: string) => {
  const { data } = await apiClient.post<CoverageActionResponse>(
    `/coverage/requests/${requestId}/cancel`,
  );
  return data;
};
