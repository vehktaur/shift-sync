"use client";

import { PublishBlockersCard } from "@/components/schedule/publish-blockers-card";
import { ScheduleDaySection } from "@/components/schedule/schedule-day-section";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleLocationGrid } from "@/components/schedule/schedule-location-grid";
import { ScheduleSkeleton } from "@/components/schedule/schedule-skeleton";
import { ShiftComposerDialog } from "@/components/schedule/shift-composer-dialog";
import { ScheduleToolbar } from "@/components/schedule/schedule-toolbar";
import { useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";
import { MetricCard } from "@/components/shared/metric-card";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
export function ScheduleView() {
  const {
    groupedShifts,
    isError,
    isLoading,
    retry,
    scheduleBoard,
    scheduleSummary,
  } =
    useScheduleBoardData();

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (isError || !scheduleBoard) {
    return (
      <QueryErrorState
        badgeLabel="Schedule unavailable"
        title="Unable to load schedules"
        description="The weekly board could not be loaded."
        onRetry={retry}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ScheduleHeader />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total shifts"
          value={String(scheduleSummary.totalShiftCount)}
          description="Visible this week."
        />
        <MetricCard
          label="Open coverage"
          value={String(scheduleSummary.openShiftCount)}
          description="Still missing staff."
        />
        <MetricCard
          label="Warnings"
          value={String(scheduleSummary.riskShiftCount)}
          description="Blocked or flagged shifts."
        />
        <MetricCard
          label="Published"
          value={String(scheduleSummary.publishedShiftCount)}
          description="Published this week."
        />
      </div>

      <ScheduleLocationGrid />
      <ScheduleToolbar />
      <PublishBlockersCard />

      {groupedShifts.length === 0 ? (
        <Card className="border-white/70 bg-white/85">
          <CardContent className="space-y-3 p-6">
            <Badge variant="outline" className="w-fit">
              No shifts
            </Badge>
            <h2 className="text-lg font-semibold tracking-tight">
              No shifts match the current filters.
            </h2>
            <p className="text-sm text-muted-foreground">
              Try another week or clear the current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedShifts.map((group) => (
          <ScheduleDaySection key={group.dayKey} group={group} />
        ))
      )}

      <ShiftComposerDialog />
    </div>
  );
}
