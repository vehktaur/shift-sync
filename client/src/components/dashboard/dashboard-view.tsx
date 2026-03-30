"use client";

import { format } from "date-fns";
import { ShieldAlert, UsersRound } from "lucide-react";

import { useOperationsDashboard } from "@/hooks/use-operations";
import { useScheduleStore } from "@/stores/schedule-store";
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
import { formatWeekRangeLabel } from "@/components/schedule/schedule.utils";

import { DashboardSkeleton } from "./dashboard-skeleton";

const statusBadgeVariant = {
  live: "success",
  upcoming: "warning",
  quiet: "outline",
} as const;

export function DashboardFeatureView() {
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const dashboardQuery = useOperationsDashboard(weekStartDate);

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <QueryErrorState
        badgeLabel="Overview"
        title="Unable to load operations"
        description="The overview data could not be loaded right now."
        onRetry={() => {
          void dashboardQuery.refetch();
        }}
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const weekOfLabel = format(
    new Date(`${dashboard.weekStartDate}T00:00:00`),
    "MMM d, yyyy",
  );
  const weekRangeLabel = formatWeekRangeLabel(
    dashboard.weekStartDate,
    dashboard.weekEndDate,
  );

  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="outline" className="w-fit">
            Overview
          </Badge>
          <CardTitle>Week of {weekOfLabel}</CardTitle>
          <CardDescription>{weekRangeLabel}</CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Overtime
            </Badge>
            <CardTitle>Assignments adding overtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.overtimeAssignments.length > 0 ? (
              dashboard.overtimeAssignments.map((assignment) => (
                <div
                  key={`${assignment.shiftId}:${assignment.staff.id}`}
                  className="border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{assignment.staff.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.shiftTitle} • {assignment.location.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.timeLabel}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        +{assignment.overtimeHoursAdded.toFixed(1)}h overtime
                      </p>
                      <p className="text-muted-foreground">
                        ${assignment.overtimePremiumCost.toFixed(2)} premium
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                No assignments are pushing staff into overtime this week.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="warning" className="w-fit">
                Compliance
              </Badge>
              <CardTitle>Labor alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.laborAlerts.length > 0 ? (
                dashboard.laborAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 size-4 text-amber-700" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{alert.staff.name}</h3>
                          <Badge
                            variant={
                              alert.severity === "critical"
                                ? "critical"
                                : "warning"
                            }
                          >
                            {alert.locationCode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.shiftTitle}
                        </p>
                        <p className="text-sm leading-6 text-foreground/80">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-border/70 bg-background/60 p-5 text-sm text-muted-foreground">
                  No compliance alerts are active in the selected week.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Fairness
              </Badge>
              <CardTitle>Assignment balance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border/70 bg-background/70 p-4">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Score
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.fairness.fairnessScore}
                </p>
              </div>
              <div className="border border-border/70 bg-background/70 p-4">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Under
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.fairness.underScheduledCount}
                </p>
              </div>
              <div className="border border-border/70 bg-background/70 p-4">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Over
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {dashboard.fairness.overScheduledCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="success" className="w-fit">
            On duty now
          </Badge>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(17rem,100%),1fr))]">
          {dashboard.onDutyLocations.map((entry) => (
            <div
              key={entry.location.id}
              className="border border-border/70 bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold">{entry.location.name}</h3>
                  <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    {entry.location.timeZoneLabel} • {entry.location.city}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant[entry.status]}>
                  {entry.status}
                </Badge>
              </div>

              {entry.activeAssignments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {entry.activeAssignments.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center gap-2 text-sm text-foreground/85"
                    >
                      <UsersRound className="size-4 text-primary" />
                      <span>{staff.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  {entry.nextShiftTimeLabel
                    ? `Next shift starts ${entry.nextShiftTimeLabel}.`
                    : "No active crew right now."}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
