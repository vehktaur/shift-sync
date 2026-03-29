"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/use-auth";
import {
  useApproveCoverageRequestMutation,
  useCancelCoverageRequestMutation,
  useCoverageBoard,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import type { CoverageBoardResponse } from "@/types/scheduling";

type CoverageWorkspaceValue = {
  coverageBoard: CoverageBoardResponse | null;
  canManageCoverage: boolean;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  approveRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  approveLoading: boolean;
  approvingRequestId: string | null;
  cancelLoading: boolean;
  cancellingRequestId: string | null;
};

const CoverageWorkspaceContext = createContext<CoverageWorkspaceValue | null>(
  null,
);

export function CoverageWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const currentUserQuery = useCurrentUser();
  const coverageBoardQuery = useCoverageBoard();
  const approveCoverageRequestMutation = useApproveCoverageRequestMutation();
  const cancelCoverageRequestMutation = useCancelCoverageRequestMutation();

  const coverageBoard = coverageBoardQuery.data ?? null;
  const canManageCoverage =
    currentUserQuery.data?.user.role === "admin" ||
    currentUserQuery.data?.user.role === "manager";

  const retry = useCallback(() => {
    void coverageBoardQuery.refetch();
  }, [coverageBoardQuery]);

  const approveRequest = useCallback(
    (requestId: string) => {
      approveCoverageRequestMutation.mutate(requestId, {
        onSuccess: () => {
          toast.success("Coverage request approved.");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Unable to approve request."));
        },
      });
    },
    [approveCoverageRequestMutation],
  );

  const cancelRequest = useCallback(
    (requestId: string) => {
      cancelCoverageRequestMutation.mutate(requestId, {
        onSuccess: () => {
          toast.success("Coverage request cancelled.");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Unable to cancel request."));
        },
      });
    },
    [cancelCoverageRequestMutation],
  );

  const value = useMemo<CoverageWorkspaceValue>(
    () => ({
      coverageBoard,
      canManageCoverage,
      isLoading: coverageBoardQuery.isLoading,
      isError: coverageBoardQuery.isError || !coverageBoard,
      retry,
      approveRequest,
      cancelRequest,
      approveLoading: approveCoverageRequestMutation.isPending,
      approvingRequestId: approveCoverageRequestMutation.isPending
        ? approveCoverageRequestMutation.variables ?? null
        : null,
      cancelLoading: cancelCoverageRequestMutation.isPending,
      cancellingRequestId: cancelCoverageRequestMutation.isPending
        ? cancelCoverageRequestMutation.variables ?? null
        : null,
    }),
    [
      approveCoverageRequestMutation.isPending,
      approveCoverageRequestMutation.variables,
      approveRequest,
      cancelCoverageRequestMutation.isPending,
      cancelCoverageRequestMutation.variables,
      cancelRequest,
      canManageCoverage,
      coverageBoard,
      coverageBoardQuery.isError,
      coverageBoardQuery.isLoading,
      retry,
    ],
  );

  return (
    <CoverageWorkspaceContext.Provider value={value}>
      {children}
    </CoverageWorkspaceContext.Provider>
  );
}

export function useCoverageWorkspace() {
  const value = useContext(CoverageWorkspaceContext);

  if (!value) {
    throw new Error(
      "useCoverageWorkspace must be used within CoverageWorkspaceProvider.",
    );
  }

  return value;
}
