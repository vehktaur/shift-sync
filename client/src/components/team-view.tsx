import { Globe2, Scale, Star, Timer } from "lucide-react";

import { appData, type Tone } from "@/lib/shift-sync-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const toneToBadgeVariant = (tone: Tone) => {
  switch (tone) {
    case "critical":
      return "critical";
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "neutral":
      return "neutral";
    default:
      return "default";
  }
};

export function TeamView() {
  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="default" className="w-fit">
            Team distribution
          </Badge>
          <CardTitle className="clamp-[text,3xl,5xl] tracking-tight">
            Hours, fairness, and certifications in one view.
          </CardTitle>
          <CardDescription className="max-w-3xl">
            This page is designed for the fairness-complaint scenario: managers
            can compare assigned hours, desired hours, premium share, and
            certified locations before they defend a schedule.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_24.375rem]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Team roster
            </Badge>
            <CardTitle>Relative scheduling load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appData.teamMembers.map((member) => {
              const delta = member.assignedHours - member.desiredHours;

              return (
                <div
                  key={member.id}
                  className=" border border-border/70 bg-background/70 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold tracking-tight">
                          {member.name}
                        </p>
                        <Badge variant={toneToBadgeVariant(member.status)}>
                          {member.roleFocus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.locations.join(" • ")}
                      </p>
                    </div>
                    <div className="grid gap-2 text-right text-sm grid-cols-[repeat(auto-fill,minmax(min(7rem,100%),1fr))] lg:min-w-[20rem]">
                      <div className=" border border-border/70 bg-white/85 px-3 py-2">
                        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                          Assigned
                        </p>
                        <p className="mt-1 font-semibold">
                          {member.assignedHours}h
                        </p>
                      </div>
                      <div className=" border border-border/70 bg-white/85 px-3 py-2">
                        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                          Desired
                        </p>
                        <p className="mt-1 font-semibold">
                          {member.desiredHours}h
                        </p>
                      </div>
                      <div className=" border border-border/70 bg-white/85 px-3 py-2">
                        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                          Premium
                        </p>
                        <p className="mt-1 font-semibold">
                          {member.premiumShifts}
                        </p>
                      </div>
                      <div className=" border border-border/70 bg-white/85 px-3 py-2">
                        <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                          Pending
                        </p>
                        <p className="mt-1 font-semibold">
                          {member.pendingRequests}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className=" border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                    <span className=" border border-border/70 bg-white/80 px-3 py-1 text-xs font-medium text-foreground/80">
                      {delta >= 0 ? `+${delta}` : delta}h vs desired
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))]">
                    <div className=" border border-border/70 bg-white/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Timer className="size-4 text-primary" />
                        Availability
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {member.availability}
                      </p>
                    </div>
                    <div className=" border border-border/70 bg-white/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Scale className="size-4 text-primary" />
                        Why it matters
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {member.note}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="warning" className="w-fit">
                Fairness score
              </Badge>
              <CardTitle>Premium balance indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {appData.fairnessLeaders.map((entry) => (
                <div
                  key={entry.name}
                  className=" border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{entry.name}</p>
                    <Badge variant={toneToBadgeVariant(entry.tone)}>
                      {entry.premiumShifts} premium
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.delta}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge variant="default" className="w-fit">
                Timezone handling
              </Badge>
              <CardTitle>Availability follows the location clock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="flex gap-3  border border-border/70 bg-background/70 p-4">
                <Globe2 className="mt-0.5 size-4 text-primary" />
                <p>
                  A 9 AM - 5 PM availability window is resolved against the
                  location timezone, which prevents accidental west-coast closes
                  from looking legal on an east-coast device.
                </p>
              </div>
              <div className="flex gap-3  border border-border/70 bg-background/70 p-4">
                <Star className="mt-0.5 size-4 text-primary" />
                <p>
                  Managers can verify whether a fairness complaint is legitimate
                  by combining desired-hour deltas, premium counts, and
                  certification coverage in one place.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
