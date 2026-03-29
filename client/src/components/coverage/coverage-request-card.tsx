"use client";

import type { ReactNode } from "react";
import { Check, CircleOff, RotateCcw, UserCheck, X } from "lucide-react";

import {
  coverageActionLabels,
  coverageStatusLabels,
  coverageStatusDescriptions,
  coverageStatusVariant,
  coverageTypeLabels,
  coverageTypeVariant,
} from "@/components/coverage/coverage.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  CoverageRequestAction,
  CoverageRequestResponse,
} from "@/types/scheduling";

type CoverageRequestCardProps = {
  request: CoverageRequestResponse;
  isActionLoading: (
    action: CoverageRequestAction,
    requestId: string,
  ) => boolean;
  onAction: (action: CoverageRequestAction, requestId: string) => void;
};

const coverageActionVariant: Record<
  CoverageRequestAction,
  "default" | "outline" | "destructive"
> = {
  approve: "default",
  cancel: "outline",
  accept: "default",
  reject: "destructive",
  claim: "default",
  withdraw: "outline",
};

const coverageActionIcon: Record<CoverageRequestAction, ReactNode> = {
  approve: <Check className="size-4" />,
  cancel: <X className="size-4" />,
  accept: <UserCheck className="size-4" />,
  reject: <X className="size-4" />,
  claim: <CircleOff className="size-4" />,
  withdraw: <RotateCcw className="size-4" />,
};

const requestStepStatusLabels = {
  done: "Done",
  current: "Current step",
  upcoming: "Next step",
} as const;

export function CoverageRequestCard({
  request,
  isActionLoading,
  onAction,
}: CoverageRequestCardProps) {
  return (
    <div className="space-y-5 border border-border/70 bg-background/70 p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={coverageTypeVariant[request.type]}>
            {coverageTypeLabels[request.type]}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={coverageStatusVariant[request.status]}>
                {coverageStatusLabels[request.status]}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {coverageStatusDescriptions[request.status]}
            </TooltipContent>
          </Tooltip>
          <Badge variant="outline">Deadline: {request.expiresInLabel}</Badge>
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{request.shift.title}</h3>
        <p className="text-sm text-muted-foreground">
          {request.shift.dateLabel} • {request.shift.timeLabel}
        </p>
        <p className="text-sm text-muted-foreground">
          {request.shift.locationName} • {request.shift.locationCode} •{" "}
          {request.shift.timeZoneLabel}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 border border-border/70 bg-white/80 p-4">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            People involved
          </h3>
          <p className="text-sm leading-6 text-foreground/85">
            Requested by {request.requestedBy.name}
            {request.counterpart ? ` • ${request.counterpart.name}` : ""}
            {request.claimant ? ` • ${request.claimant.name}` : ""}
          </p>
          {request.note && (
            <p className="text-sm leading-6 text-muted-foreground">{request.note}</p>
          )}
        </div>

        <div className="space-y-2 border border-border/70 bg-white/80 p-4">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Status
          </h3>
          <p className="text-sm leading-6 text-foreground/85">
            {request.originalAssignmentRemains
              ? "Original assignment remains active."
              : "Original assignment has been replaced."}
          </p>
          {request.suggestedClaimants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {request.suggestedClaimants.map((staff) => (
                <Badge key={staff.id} variant="outline">
                  {staff.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))] gap-3">
        {request.steps.map((step) => (
          <div key={step.label} className="border border-border/70 bg-white/80 p-3">
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
                {requestStepStatusLabels[step.status]}
              </span>
            </div>
            <h4 className="mt-3 text-sm font-medium">{step.label}</h4>
          </div>
        ))}
      </div>

      {request.availableActions.length > 0 && (
        <div className="flex flex-wrap gap-3 border-t border-border/70 pt-4">
          {request.availableActions.map((action) => (
            <Button
              key={action}
              variant={coverageActionVariant[action]}
              loading={isActionLoading(action, request.id)}
              onClick={() => onAction(action, request.id)}
            >
              {coverageActionIcon[action]}
              {coverageActionLabels[action]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
