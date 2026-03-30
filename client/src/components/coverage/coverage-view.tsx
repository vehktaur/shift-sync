"use client";

import { useState } from "react";
import { toast } from "sonner";

import { CoverageHeader } from "@/components/coverage/coverage-header";
import { CoverageInsights } from "@/components/coverage/coverage-insights";
import { CoverageRequestDialog } from "@/components/coverage/coverage-request-dialog";
import { CoverageRequestQueue } from "@/components/coverage/coverage-request-queue";
import { CoverageSkeleton } from "@/components/coverage/coverage-skeleton";
import { CoverageStaffShifts } from "@/components/coverage/coverage-staff-shifts";
import {
  buildCoverageBoardSummary,
  coverageStatusLabels,
} from "@/components/coverage/coverage.utils";
import { formatWeekRangeLabel } from "@/components/schedule/schedule.utils";
import { MetricCard } from "@/components/shared/metric-card";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-auth";
import {
  useAcceptCoverageRequest,
  useApproveCoverageRequest,
  useCancelCoverageRequest,
  useClaimCoverageRequest,
  useCoverageBoard,
  useRejectCoverageRequest,
  useSchedulingBoard,
  useWithdrawCoverageRequest,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import { useScheduleStore } from "@/stores/schedule-store";
import type {
  CoverageRequestAction,
  CoverageRequestResponse,
  ShiftResponse,
} from "@/types/scheduling";

type CoverageComposerState = {
  mode: "swap" | "drop";
  shift: ShiftResponse;
} | null;

const activeCoverageStatuses: CoverageRequestResponse["status"][] = [
  "pending_counterparty",
  "pending_manager",
  "open",
];

const buildActiveRequestSummaryByShiftId = (
  requests: CoverageRequestResponse[],
  requesterId: string,
) =>
  requests.reduce<Record<string, string>>((summary, request) => {
    if (
      request.requestedBy.id !== requesterId ||
      !activeCoverageStatuses.includes(request.status)
    ) {
      return summary;
    }

    summary[request.shift.id] = `${request.type} ${coverageStatusLabels[request.status].toLowerCase()}`;
    return summary;
  }, {});

const getAssignedShiftsForUser = (shifts: ShiftResponse[], userId: string) =>
  shifts.filter((shift) => shift.assignees.some((assignee) => assignee.id === userId));

export function CoverageView() {
  const [composerState, setComposerState] = useState<CoverageComposerState>(null);
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const {
    data: session,
    isPending: sessionPending,
    isError: sessionError,
    refetch: refetchSession,
  } = useSession();
  const {
    data: coverageBoard,
    isPending: coverageBoardPending,
    isError: coverageBoardError,
    refetch: refetchCoverageBoard,
  } = useCoverageBoard();
  const role = session?.user.role ?? null;
  const isStaff = role === "staff";
  const canManageCoverage = role === "admin" || role === "manager";
  const {
    data: scheduleBoard,
    isPending: scheduleBoardPending,
    isError: scheduleBoardError,
    refetch: refetchScheduleBoard,
  } = useSchedulingBoard(weekStartDate, {
    enabled: isStaff,
  });
  const approveCoverageRequestMutation = useApproveCoverageRequest();
  const cancelCoverageRequestMutation = useCancelCoverageRequest();
  const acceptCoverageRequestMutation = useAcceptCoverageRequest();
  const rejectCoverageRequestMutation = useRejectCoverageRequest();
  const claimCoverageRequestMutation = useClaimCoverageRequest();
  const withdrawCoverageRequestMutation = useWithdrawCoverageRequest();
  const coverageSummary = buildCoverageBoardSummary(coverageBoard?.requests ?? []);
  const isLoading =
    sessionPending ||
    coverageBoardPending ||
    (isStaff && scheduleBoardPending);

  if (isLoading) {
    return <CoverageSkeleton />;
  }

  if (sessionError || !session || coverageBoardError || !coverageBoard) {
    return (
      <QueryErrorState
        badgeLabel="Coverage unavailable"
        title="Unable to load coverage"
        description="The coverage queue could not be loaded."
        onRetry={() => {
          void Promise.all([
            refetchSession(),
            refetchCoverageBoard(),
            refetchScheduleBoard(),
          ]);
        }}
      />
    );
  }

  const currentUser = session.user;
  const myAssignedShifts =
    isStaff && scheduleBoard ? getAssignedShiftsForUser(scheduleBoard.shifts, currentUser.id) : [];
  const weekLabel =
    scheduleBoard
      ? formatWeekRangeLabel(
          scheduleBoard.weekStartDate,
          scheduleBoard.weekEndDate,
        )
      : "";
  const activeRequestSummaryByShiftId = isStaff
    ? buildActiveRequestSummaryByShiftId(coverageBoard.requests, currentUser.id)
    : {};

  const runCoverageAction = async (
    action: CoverageRequestAction,
    requestId: string,
  ) => {
    try {
      switch (action) {
        case "approve":
          await approveCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Coverage request approved.");
          return;
        case "cancel":
          await cancelCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Coverage request cancelled.");
          return;
        case "accept":
          await acceptCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Swap accepted.");
          return;
        case "reject":
          await rejectCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Swap declined.");
          return;
        case "claim":
          await claimCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Drop request claimed.");
          return;
        case "withdraw":
          await withdrawCoverageRequestMutation.mutateAsync(requestId);
          toast.success("Coverage request withdrawn.");
          return;
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update coverage request."));
    }
  };

  const isActionLoading = (
    action: CoverageRequestAction,
    requestId: string,
  ) => {
    switch (action) {
      case "approve":
        return (
          approveCoverageRequestMutation.isPending &&
          approveCoverageRequestMutation.variables === requestId
        );
      case "cancel":
        return (
          cancelCoverageRequestMutation.isPending &&
          cancelCoverageRequestMutation.variables === requestId
        );
      case "accept":
        return (
          acceptCoverageRequestMutation.isPending &&
          acceptCoverageRequestMutation.variables === requestId
        );
      case "reject":
        return (
          rejectCoverageRequestMutation.isPending &&
          rejectCoverageRequestMutation.variables === requestId
        );
      case "claim":
        return (
          claimCoverageRequestMutation.isPending &&
          claimCoverageRequestMutation.variables === requestId
        );
      case "withdraw":
        return (
          withdrawCoverageRequestMutation.isPending &&
          withdrawCoverageRequestMutation.variables === requestId
        );
    }
  };

  return (
    <>
      <div className="space-y-5">
        <CoverageHeader />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total requests"
            value={String(coverageSummary.totalRequests)}
            description="Visible in this queue."
          />
          <MetricCard
            label="Needs manager"
            value={String(coverageSummary.managerActionCount)}
            description="Waiting on approval."
          />
          <MetricCard
            label="Swap requests"
            value={String(coverageSummary.swapRequestCount)}
            description="Two-party changes."
          />
          <MetricCard
            label="Drop requests"
            value={String(coverageSummary.dropRequestCount)}
            description="Open coverage requests."
          />
        </div>

        {isStaff && (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_24rem]">
            {scheduleBoardError || !scheduleBoard ? (
              <Card className="border-white/70 bg-white/85">
                <CardHeader>
                  <CardTitle>My shifts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Unable to load your assigned shifts for this week.
                </CardContent>
              </Card>
            ) : (
              <CoverageStaffShifts
                activeRequestSummaryByShiftId={activeRequestSummaryByShiftId}
                shifts={myAssignedShifts}
                weekLabel={weekLabel}
                onRequestDrop={(shift) => setComposerState({ mode: "drop", shift })}
                onRequestSwap={(shift) => setComposerState({ mode: "swap", shift })}
              />
            )}
            <CoverageInsights />
          </div>
        )}

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_24rem]">
          <CoverageRequestQueue
            description={
              canManageCoverage
                ? "Requests that still need action."
                : "Requests you can track or respond to."
            }
            requests={coverageBoard.requests}
            title={canManageCoverage ? "Coverage queue" : "My requests"}
            isActionLoading={isActionLoading}
            onAction={(action, requestId) => {
              void runCoverageAction(action, requestId);
            }}
          />

          {!isStaff && <CoverageInsights />}
        </div>
      </div>

      <CoverageRequestDialog
        key={
          composerState
            ? `${composerState.mode}:${composerState.shift.id}`
            : "coverage-dialog"
        }
        mode={composerState?.mode ?? null}
        open={Boolean(composerState)}
        shift={composerState?.shift ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setComposerState(null);
          }
        }}
      />
    </>
  );
}
