import { PencilLine, Send } from "lucide-react";

import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";
import type { ShiftFilter } from "@/components/schedule/schedule.utils";
import { shiftFilters } from "@/components/schedule/schedule.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScheduleToolbar() {
  const {
    canManageBoard,
    locationFilter,
    publishWeek,
    publishWeekLoading,
    scheduleBoard,
    setLocationFilter,
    setShiftFilter,
    shiftFilter,
    unpublishWeek,
    unpublishWeekLoading,
  } = useScheduleWorkspace();

  if (!scheduleBoard) {
    return null;
  }

  return (
    <Card className="border-white/70 bg-white/85">
      <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-4 md:grid-cols-2 xl:w-full xl:max-w-3xl">
          <div className="space-y-2">
            <label
              htmlFor="location-filter"
              className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Location
            </label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="location-filter">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {scheduleBoard.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="risk-filter"
              className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Filter
            </label>
            <Select
              value={shiftFilter}
              onValueChange={(value) => setShiftFilter(value as ShiftFilter)}
            >
              <SelectTrigger id="risk-filter">
                <SelectValue placeholder="Board filter" />
              </SelectTrigger>
              <SelectContent>
                {shiftFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canManageBoard ? (
          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Button
              variant="outline"
              loading={unpublishWeekLoading}
              onClick={unpublishWeek}
            >
              <PencilLine className="size-4" />
              Unpublish week
            </Button>
            <Button loading={publishWeekLoading} onClick={publishWeek}>
              <Send className="size-4" />
              Publish week
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
