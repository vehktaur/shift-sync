export const coverageTypeVariant = {
  swap: "warning",
  drop: "critical",
} as const;

export const coverageStatusVariant = {
  pending_counterparty: "neutral",
  pending_manager: "warning",
  open: "default",
  approved: "success",
  cancelled: "neutral",
  expired: "critical",
} as const;
