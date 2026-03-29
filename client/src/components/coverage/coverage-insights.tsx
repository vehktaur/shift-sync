import Link from "next/link";
import {
  ArrowRightLeft,
  Check,
  Clock3,
  RefreshCcw,
  Siren,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoverageInsights() {
  return (
    <div className="space-y-5">
      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="warning" className="w-fit">
            Rules
          </Badge>
          <CardTitle>Coverage rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <RefreshCcw className="size-4 text-primary" />
              <p className="font-semibold">Edits cancel stale swaps</p>
            </div>
          </div>
          <div className="border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <TimerReset className="size-4 text-primary" />
              <p className="font-semibold">Drops can expire before service</p>
            </div>
          </div>
          <div className="border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <Siren className="size-4 text-primary" />
              <p className="font-semibold">Pending requests stay capped</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <Badge variant="critical" className="w-fit">
            Flow
          </Badge>
          <CardTitle>Approval path</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <div className="flex gap-3 border border-border/70 bg-background/70 p-4">
            <Clock3 className="mt-0.5 size-4 text-primary" />
            <p>Open the queue and review requests waiting on action.</p>
          </div>
          <div className="flex gap-3 border border-border/70 bg-background/70 p-4">
            <ArrowRightLeft className="mt-0.5 size-4 text-primary" />
            <p>Check the request parties and suggested replacements.</p>
          </div>
          <div className="flex gap-3 border border-border/70 bg-background/70 p-4">
            <Check className="mt-0.5 size-4 text-primary" />
            <p>Approve or cancel and let the board refresh from the backend.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/85">
        <CardContent className="space-y-3 p-5">
          <Badge variant="outline" className="w-fit">
            Back to schedule
          </Badge>
          <p className="text-lg font-semibold tracking-tight">Weekly board</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Review shifts, staffing, and publish status.
          </p>
          <Button asChild>
            <Link href="/schedule">Open schedule</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
