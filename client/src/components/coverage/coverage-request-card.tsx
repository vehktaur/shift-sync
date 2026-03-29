import { Check, X } from "lucide-react";

import { coverageStatusVariant, coverageTypeVariant } from "@/components/coverage/coverage.utils";
import { useCoverageWorkspace } from "@/components/coverage/coverage-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CoverageRequestResponse } from "@/types/scheduling";

type CoverageRequestCardProps = {
  request: CoverageRequestResponse;
};

export function CoverageRequestCard({ request }: CoverageRequestCardProps) {
  const {
    approveLoading,
    approveRequest,
    approvingRequestId,
    cancelLoading,
    cancelRequest,
    cancellingRequestId,
    canManageCoverage,
  } = useCoverageWorkspace();

  return (
    <div className="space-y-5 border border-border/70 bg-background/70 p-5">
      <div className="space-y-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={coverageTypeVariant[request.type]}>
              {request.type}
            </Badge>
            <Badge variant={coverageStatusVariant[request.status]}>
              {request.statusLabel}
            </Badge>
            <Badge variant="outline">{request.expiresInLabel}</Badge>
          </div>
          <p className="text-xl font-semibold tracking-tight">
            {request.shift.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.shift.dateLabel} • {request.shift.timeLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {request.shift.locationName} ({request.shift.locationCode}) •{" "}
            {request.shift.timeZoneLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 border border-border/70 bg-white/80 p-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Parties
          </p>
          <p className="text-sm leading-6 text-foreground/85">
            Requested by {request.requestedBy.name}
            {request.counterpart ? ` • ${request.counterpart.name}` : ""}
            {request.claimant ? ` • ${request.claimant.name}` : ""}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{request.note}</p>
        </div>

        <div className="space-y-2 border border-border/70 bg-white/80 p-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Status
          </p>
          <p className="text-sm leading-6 text-foreground/85">
            {request.originalAssignmentRemains
              ? "Original assignment remains active."
              : "Original assignment has been replaced."}
          </p>
          {request.suggestedClaimants.length ? (
            <div className="flex flex-wrap gap-2">
              {request.suggestedClaimants.map((staff) => (
                <Badge key={staff.id} variant="outline">
                  {staff.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No suggested replacements.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))]">
        {request.steps.map((step) => (
          <div
            key={step.label}
            className="border border-border/70 bg-white/80 p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`size-2 ${
                  step.status === "done"
                    ? "bg-emerald-500"
                    : step.status === "current"
                      ? "bg-primary"
                      : "bg-border"
                }`}
              />
              <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {step.status}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium">{step.label}</p>
          </div>
        ))}
      </div>

      {canManageCoverage && request.status === "pending_manager" ? (
        <div className="flex flex-wrap gap-3 border-t border-border/70 pt-4">
          <Button
            loading={approveLoading && approvingRequestId === request.id}
            onClick={() => approveRequest(request.id)}
          >
            <Check className="size-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            loading={cancelLoading && cancellingRequestId === request.id}
            onClick={() => cancelRequest(request.id)}
          >
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
