import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";

export function ScheduleHeader() {
  const { canManageBoard, openCreateDialog, scheduleBoard } =
    useScheduleWorkspace();

  if (!scheduleBoard) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-white/70 bg-white/88">
      <CardHeader className="gap-5 bg-[linear-gradient(145deg,rgba(66,137,149,0.16),rgba(255,255,255,0.72)_52%,rgba(224,132,82,0.12))]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Weekly board
          </Badge>
          <Badge variant="outline">{scheduleBoard.weekLabel}</Badge>
          <Badge variant="outline">
            {scheduleBoard.publishCutoffHours}h cutoff
          </Badge>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="clamp-[text,2rem,3.5rem] tracking-tight">
              Schedules
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Shifts, staffing, and publish status by location.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/coverage">Coverage queue</Link>
            </Button>
            {canManageBoard ? (
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                Create shift
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
