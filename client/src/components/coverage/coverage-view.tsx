"use client";

import { CoverageHeader } from "@/components/coverage/coverage-header";
import { CoverageInsights } from "@/components/coverage/coverage-insights";
import { CoverageRequestCard } from "@/components/coverage/coverage-request-card";
import { CoverageSkeleton } from "@/components/coverage/coverage-skeleton";
import {
  CoverageWorkspaceProvider,
  useCoverageWorkspace,
} from "@/components/coverage/coverage-workspace";
import { MetricCard } from "@/components/shared/metric-card";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function CoverageViewContent() {
  const { coverageBoard, isError, isLoading, retry } = useCoverageWorkspace();

  if (isLoading) {
    return <CoverageSkeleton />;
  }

  if (isError || !coverageBoard) {
    return (
      <QueryErrorState
        badgeLabel="Coverage unavailable"
        title="Unable to load coverage"
        description="The coverage queue could not be loaded."
        onRetry={retry}
      />
    );
  }

  const { requests, summary } = coverageBoard;

  return (
    <div className="space-y-5">
      <CoverageHeader />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total requests"
          value={String(summary.totalRequests)}
          description="Visible in this queue."
        />
        <MetricCard
          label="Needs manager"
          value={String(summary.managerActionCount)}
          description="Waiting on approval."
        />
        <MetricCard
          label="Swap requests"
          value={String(summary.swapRequestCount)}
          description="Two-party coverage swaps."
        />
        <MetricCard
          label="Drop requests"
          value={String(summary.dropRequestCount)}
          description="Offered shifts."
        />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_24rem]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="default" className="w-fit">
              Queue
            </Badge>
            <CardTitle>Coverage requests</CardTitle>
            <CardDescription>Requests that are still in motion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.length === 0 ? (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm leading-6 text-muted-foreground">
                No active coverage requests.
              </div>
            ) : (
              requests.map((request) => (
                <CoverageRequestCard key={request.id} request={request} />
              ))
            )}
          </CardContent>
        </Card>

        <CoverageInsights />
      </div>
    </div>
  );
}

export function CoverageView() {
  return (
    <CoverageWorkspaceProvider>
      <CoverageViewContent />
    </CoverageWorkspaceProvider>
  );
}
