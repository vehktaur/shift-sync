import type { CoverageRequestResponse } from "@/types/scheduling";

export const coverageTypeVariant = {
  swap: "warning",
  drop: "critical",
} as const;

export const coverageStatusVariant = {
  pending_counterparty: "neutral",
  pending_manager: "warning",
  open: "default",
  approved: "success",
  rejected: "critical",
  cancelled: "neutral",
  expired: "critical",
} as const;

export const coverageStatusLabels = {
  pending_counterparty: "Needs response",
  pending_manager: "Needs approval",
  open: "Open",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
} as const;

export const coverageActionLabels = {
  approve: "Approve",
  cancel: "Cancel",
  accept: "Accept",
  reject: "Reject",
  claim: "Claim",
  withdraw: "Withdraw",
} as const;

export const coverageTypeLabels = {
  swap: "Swap request",
  drop: "Drop request",
} as const;

export const coverageStatusDescriptions = {
  pending_counterparty: "Waiting for the requested teammate to respond.",
  pending_manager: "Waiting for a manager to make the final decision.",
  open: "Open for eligible staff to claim.",
  approved: "Approved and applied to the schedule.",
  rejected: "Rejected and left unchanged.",
  cancelled: "Cancelled before it was approved.",
  expired: "Closed automatically after the deadline passed.",
} as const;

export const buildCoverageBoardSummary = (
  requests: CoverageRequestResponse[],
) => ({
  totalRequests: requests.length,
  managerActionCount: requests.filter(
    (request) => request.status === "pending_manager",
  ).length,
  dropRequestCount: requests.filter((request) => request.type === "drop").length,
  swapRequestCount: requests.filter((request) => request.type === "swap").length,
});
