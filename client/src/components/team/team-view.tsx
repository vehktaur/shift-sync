"use client";

import { getWeekEndDate } from "@/components/schedule/schedule.utils";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFairnessReport } from "@/hooks/use-operations";
import { useWorkspaceStore } from "@/stores/workspace-store";

import { TeamSkeleton } from "./team-skeleton";

const statusVariant = {
  under: "warning",
  balanced: "success",
  over: "critical",
} as const;

export function TeamFeatureView() {
  const weekStartDate = useWorkspaceStore((state) => state.weekStartDate);
  const weekEndDate = getWeekEndDate(weekStartDate);
  const {
    data: fairness,
    isPending: fairnessPending,
    isError: fairnessError,
    refetch: refetchFairness,
  } = useFairnessReport(weekStartDate, weekEndDate);

  if (fairnessPending) {
    return <TeamSkeleton />;
  }

  if (fairnessError || !fairness) {
    return (
      <QueryErrorState
        badgeLabel="Team"
        title="Unable to load team balance"
        description="The fairness report could not be loaded right now."
        onRetry={() => {
          void refetchFairness();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="outline" className="w-fit">
            Team
          </Badge>
          <CardTitle>Hours and fairness</CardTitle>
          <CardDescription>
            {fairness.periodStartDate} to {fairness.periodEndDate}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card
          className="border-white/70 bg-white/85"
          data-tour="team-distribution"
        >
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Distribution
            </Badge>
            <CardTitle>Assigned vs desired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fairness.teamMembers.map((member) => (
              <div
                key={member.staff.id}
                className="border border-border/70 bg-background/70 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{member.staff.name}</h3>
                      <Badge variant={statusVariant[member.status]}>
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.staff.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.staff.availabilitySummary}
                    </p>
                  </div>

                  <div className="grid gap-2 text-right text-sm sm:grid-cols-4">
                    <div className="border border-border/70 bg-white/85 px-3 py-2">
                      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                        Assigned
                      </p>
                      <p className="mt-1 font-semibold">{member.assignedHours}h</p>
                    </div>
                    <div className="border border-border/70 bg-white/85 px-3 py-2">
                      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                        Target
                      </p>
                      <p className="mt-1 font-semibold">
                        {member.targetHoursForPeriod}h
                      </p>
                    </div>
                    <div className="border border-border/70 bg-white/85 px-3 py-2">
                      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                        Premium
                      </p>
                      <p className="mt-1 font-semibold">{member.premiumShiftCount}</p>
                    </div>
                    <div className="border border-border/70 bg-white/85 px-3 py-2">
                      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                        Pending
                      </p>
                      <p className="mt-1 font-semibold">
                        {member.pendingCoverageRequests}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {member.staff.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {member.desiredHoursDelta >= 0 ? "+" : ""}
                    {member.desiredHoursDelta}h vs target
                  </Badge>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {member.note}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Fairness
              </Badge>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="border border-border/70 bg-background/70 p-4">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Overall
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {fairness.fairnessScore}
                </p>
              </div>
              <div className="border border-border/70 bg-background/70 p-4">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Premium shifts
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {fairness.premiumShiftCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Split
              </Badge>
              <CardTitle>Team balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border border-border/70 bg-background/70 p-4">
                <h3 className="text-sm font-semibold">Under scheduled</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fairness.underScheduledCount} staff
                </p>
              </div>
              <div className="border border-border/70 bg-background/70 p-4">
                <h3 className="text-sm font-semibold">Balanced</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fairness.balancedCount} staff
                </p>
              </div>
              <div className="border border-border/70 bg-background/70 p-4">
                <h3 className="text-sm font-semibold">Over scheduled</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fairness.overScheduledCount} staff
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
