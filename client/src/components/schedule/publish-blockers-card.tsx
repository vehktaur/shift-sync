import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";

import { shiftStateBadgeVariant } from "./schedule.utils";

export function PublishBlockersCard() {
  const { publishBlockers } = useScheduleBoardData();
  const blockers = publishBlockers;

  if (blockers.length === 0) {
    return null;
  }

  return (
    <Card className="border-white/70 bg-white/85">
      <CardHeader>
        <Badge variant="warning" className="w-fit">
          Publish blockers
        </Badge>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Items preventing a clean publish.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        {blockers.map((blocker) => (
          <div
            key={blocker.id}
            className="space-y-3 border border-border/70 bg-background/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={shiftStateBadgeVariant[blocker.state]}>
                {blocker.state}
              </Badge>
              <Badge variant="outline">{blocker.locationCode}</Badge>
              <Badge variant="outline">{blocker.timeLabel}</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {blocker.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {blocker.reason}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
