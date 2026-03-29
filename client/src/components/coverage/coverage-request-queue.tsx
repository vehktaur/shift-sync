"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CoverageRequestAction,
  CoverageRequestResponse,
} from "@/types/scheduling";
import { CoverageRequestCard } from "@/components/coverage/coverage-request-card";

type CoverageRequestQueueProps = {
  description: string;
  requests: CoverageRequestResponse[];
  title: string;
  isActionLoading: (
    action: CoverageRequestAction,
    requestId: string,
  ) => boolean;
  onAction: (action: CoverageRequestAction, requestId: string) => void;
};

export function CoverageRequestQueue({
  description,
  requests,
  title,
  isActionLoading,
  onAction,
}: CoverageRequestQueueProps) {
  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
            No active coverage requests.
          </div>
        ) : (
          requests.map((request) => (
            <CoverageRequestCard
              key={request.id}
              request={request}
              isActionLoading={isActionLoading}
              onAction={onAction}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
