import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { formatWeekRangeLabel } from "@/components/schedule/schedule.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ScheduleHeader() {
  const [goToCurrentWeek, goToNextWeek, goToPreviousWeek] = useWorkspaceStore(
    useShallow((state) => [
      state.goToCurrentWeek,
      state.goToNextWeek,
      state.goToPreviousWeek,
    ]),
  );
  const [closeComposer, openCreateDialog] = useScheduleUiStore(
    useShallow((state) => [state.closeComposer, state.openCreateDialog]),
  );
  const { canManageBoard, scheduleBoard } = useScheduleBoardData();

  const handlePreviousWeek = () => {
    closeComposer();
    goToPreviousWeek();
  };

  const handleCurrentWeek = () => {
    closeComposer();
    goToCurrentWeek();
  };

  const handleNextWeek = () => {
    closeComposer();
    goToNextWeek();
  };

  const handleCreateShift = () => {
    closeComposer();
    openCreateDialog();
  };

  if (!scheduleBoard) {
    return null;
  }

  const weekLabel = formatWeekRangeLabel(
    scheduleBoard.weekStartDate,
    scheduleBoard.weekEndDate,
  );

  return (
    <Card
      className="overflow-hidden border-white/70 bg-white/88"
      data-tour="schedule-header"
    >
      <CardHeader className="gap-5 bg-[linear-gradient(145deg,rgba(66,137,149,0.16),rgba(255,255,255,0.72)_52%,rgba(224,132,82,0.12))]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Weekly board
          </Badge>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="clamp-[text,2rem,3.5rem] tracking-tight">
              Schedules
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Sunday to Saturday.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" onClick={handleCurrentWeek}>
              Current week
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              onClick={handleNextWeek}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Badge variant="outline">{weekLabel}</Badge>
            <Button variant="outline" asChild>
              <Link href="/coverage">Coverage queue</Link>
            </Button>
            {canManageBoard && (
              <Button onClick={handleCreateShift} data-tour="create-shift-button">
                <Plus className="size-4" />
                Create shift
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
