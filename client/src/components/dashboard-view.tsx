import Link from "next/link";
import {
  ArrowRight,
  ClockAlert,
  Map,
  ShieldAlert,
  Siren,
  UsersRound,
} from "lucide-react";

import { appData, type Tone } from "@/lib/shift-sync-data";
import { Button } from "@/components/ui/button";
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

export function DashboardView() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden border border-white/80 bg-[linear-gradient(135deg,rgba(26,86,96,0.96),rgba(17,42,54,0.92)),radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)] text-white shadow-[0_2.25rem_7.5rem_-4.375rem_rgba(15,23,42,0.85)]">
        <div className="grid gap-6 clamp-[px,3,6] clamp-[py,4,6] lg:grid-cols-[minmax(0,1.4fr)_minmax(18.125rem,0.8fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-white/15 bg-white/12 text-white"
                variant="outline"
              >
                Coastal Eats operations
              </Badge>
              <Badge
                className="border-white/15 bg-white/12 text-white"
                variant="outline"
              >
                {appData.workspace.weekLabel}
              </Badge>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-4xl clamp-[text,3xl,6xl] font-semibold tracking-tight">
                See risk before it becomes payroll cleanup.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                The manager dashboard prioritizes what matters in the
                assessment: live coverage gaps, overtime exposure, fairness
                drift, and which schedule actions are safe to publish across all
                four locations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className=" bg-white text-slate-900 hover:bg-white/90"
              >
                <Link href="/schedule">Inspect weekly board</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className=" border-white/20 bg-white/8 text-white hover:bg-white/12"
              >
                <Link href="/coverage">Run coverage workflow</Link>
              </Button>
            </div>
          </div>

          <Card className="border-white/10 bg-white/10 text-white shadow-none">
            <CardHeader className="pb-3">
              <Badge
                className="w-fit border-white/15 bg-white/12 text-white"
                variant="outline"
              >
                Sunday night priority
              </Badge>
              <CardTitle className="text-white">
                Fastest legal coverage path
              </CardTitle>
              <CardDescription className="text-white/72">
                Maria&apos;s Sunday callout stays attached until approval, while
                the system surfaces the fastest qualified replacements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className=" border border-white/10 bg-slate-950/18 p-4">
                <p className="text-sm font-semibold">
                  Boardwalk Kitchen • 7:00 PM ET
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Devon Lee and John Rivera are both legal replacements. Devon
                  keeps overtime flat and preserves Tidehouse flexibility.
                </p>
              </div>
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Coverage options live now</span>
                <span className="font-semibold">2 staff ready</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]">
        {appData.metrics.map((metric) => (
          <Card key={metric.label} className="border-white/70 bg-white/85">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant={toneToBadgeVariant(metric.tone)}>
                  {metric.label}
                </Badge>
                <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Weekly
                </span>
              </div>
              <div className="space-y-2">
                <p className="clamp-[text,3xl,5xl] font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {metric.context}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground/80">
                {metric.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_26.25rem]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Badge variant="critical" className="w-fit">
                Coverage command
              </Badge>
              <CardTitle className="clamp-[text,2xl,3xl]">
                What needs attention first
              </CardTitle>
              <CardDescription>
                The dashboard ranks live issues by urgency so managers do not
                have to bounce between calendar, messages, and labor reports.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="">
              <Link href="/coverage">Open workflow</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))]">
            {appData.alerts.map((alert) => (
              <div
                key={alert.id}
                className=" border border-border/70 bg-background/70 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={toneToBadgeVariant(alert.tone)}>
                    {alert.title}
                  </Badge>
                  <Siren className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {alert.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm font-medium">
                  <span>{alert.action}</span>
                  <ArrowRight className="size-4 text-primary" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Fairness snapshot
            </Badge>
            <CardTitle>Premium shift distribution</CardTitle>
            <CardDescription>
              Friday and Saturday evenings are tracked as premium so managers
              can defend or correct assignment patterns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appData.fairnessLeaders.map((entry) => (
              <div
                key={entry.name}
                className="flex items-start justify-between gap-4  border border-border/70 bg-background/70 p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">{entry.delta}</p>
                </div>
                <div className="text-right">
                  <Badge variant={toneToBadgeVariant(entry.tone)}>
                    {entry.premiumShifts} premium
                  </Badge>
                </div>
              </div>
            ))}
            <div className=" border border-primary/12 bg-primary/8 p-4 text-sm leading-6 text-muted-foreground">
              The open Saturday premium slot is intentionally steered toward
              Priya or Devon to avoid concentrating premium earnings on Maria
              again this week.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))]">
        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="success" className="w-fit">
              On duty now
            </Badge>
            <CardTitle>Live location board</CardTitle>
            <CardDescription>
              This is the realtime surface managers would keep open during
              service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appData.liveDutyBoard.map((location) => (
              <div
                key={location.location}
                className=" border border-border/70 bg-background/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{location.location}</p>
                    <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                      {location.timezone} • {location.manager}
                    </p>
                  </div>
                  <div className="flex items-center gap-2  border border-emerald-500/20 bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="size-2 bg-emerald-500 animate-pulse" />
                    Live
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {location.clockedIn.join(", ")}
                </p>
                <p className="mt-2 text-sm text-foreground/80">
                  {location.note}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Compliance queue
            </Badge>
            <CardTitle>Warnings with reasons attached</CardTitle>
            <CardDescription>
              Every risky assignment explains which rule was hit and why, so the
              manager can fix it without guessing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className=" border border-amber-500/15 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <ClockAlert className="size-4" />
                <p className="font-semibold">10-hour rest guardrail</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-amber-900/80">
                Sunday west-coast bartender lock prevents John Rivera from being
                claimed by two managers at once and preserves legal turnaround
                time.
              </p>
            </div>
            <div className=" border border-rose-500/15 bg-rose-500/10 p-4">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="size-4" />
                <p className="font-semibold">Overtime hard block</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-rose-900/80">
                Olivia Brooks is blocked from the Friday premium close because
                it takes her well beyond the weekly overtime target and beyond
                the intended labor threshold.
              </p>
            </div>
            <div className=" border border-primary/12 bg-primary/8 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Map className="size-4" />
                <p className="font-semibold">Timezone-aware availability</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Ethan&apos;s availability is rendered in each location&apos;s
                timezone, which makes the Thursday west-coast close an explicit
                no-go instead of a silent mismatch.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardHeader>
            <Badge variant="default" className="w-fit">
              Notification center
            </Badge>
            <CardTitle>Persisted activity feed</CardTitle>
            <CardDescription>
              Unread and read state is visible here, but the same items would
              also power badges and in-app toasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appData.notifications.slice(0, 4).map((notification) => (
              <div
                key={notification.id}
                className=" border border-border/70 bg-background/70 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={toneToBadgeVariant(notification.tone)}>
                    {notification.read ? "Read" : "Unread"}
                  </Badge>
                  <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                    {notification.time}
                  </span>
                </div>
                <p className="mt-3 font-semibold">{notification.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {notification.body}
                </p>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full ">
              <Link href="/notifications">See all notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))]">
        {appData.scenarioCards.map((scenario) => (
          <Card key={scenario.title} className="border-white/70 bg-white/85">
            <CardHeader>
              <Badge
                variant={toneToBadgeVariant(scenario.tone)}
                className="w-fit"
              >
                Scenario
              </Badge>
              <CardTitle>{scenario.title}</CardTitle>
              <CardDescription>{scenario.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-foreground/85">
                {scenario.result}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <UsersRound className="size-4" />
                Manager-facing proof point
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
