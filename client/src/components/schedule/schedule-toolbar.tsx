import { PencilLine, Send } from "lucide-react";
import { toast } from "sonner";

import type { ShiftFilter } from "@/components/schedule/schedule.utils";
import { shiftFilters } from "@/components/schedule/schedule.utils";
import { useScheduleBoardData } from "@/components/schedule/use-schedule-board-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useLocations,
  usePublishWeek,
  useUnpublishWeek,
} from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScheduleStore } from "@/stores/schedule-store";

export function ScheduleToolbar() {
  const locationFilter = useScheduleStore((state) => state.locationFilter);
  const weekStartDate = useScheduleStore((state) => state.weekStartDate);
  const setLocationFilter = useScheduleStore((state) => state.setLocationFilter);
  const setShiftFilter = useScheduleStore((state) => state.setShiftFilter);
  const shiftFilter = useScheduleStore((state) => state.shiftFilter);
  const { data: locationsData } = useLocations();
  const publishWeekMutation = usePublishWeek(weekStartDate);
  const unpublishWeekMutation = useUnpublishWeek(weekStartDate);
  const { canManageBoard, scheduleBoard } = useScheduleBoardData();
  const locations = locationsData ?? [];

  if (!scheduleBoard) {
    return null;
  }

  return (
    <Card className="border-white/70 bg-white/85" data-tour="schedule-toolbar">
      <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-4 md:grid-cols-2 xl:w-full xl:max-w-3xl">
          <div className="space-y-2">
            <label
              htmlFor="location-filter"
              className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Location filter
            </label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="location-filter">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((location) => (
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
              Shift view
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

        {canManageBoard && (
          <div className="flex flex-wrap gap-3 xl:justify-end">
            <Button
              variant="outline"
              loading={unpublishWeekMutation.isPending}
              onClick={async () => {
                try {
                  await unpublishWeekMutation.mutateAsync();
                  toast.success("Week moved to draft.");
                } catch (error) {
                  toast.error(
                    getApiErrorMessage(error, "Unable to unpublish week."),
                  );
                }
              }}
            >
              <PencilLine className="size-4" />
              Unpublish week
            </Button>
            <Button
              loading={publishWeekMutation.isPending}
              onClick={async () => {
                try {
                  await publishWeekMutation.mutateAsync();
                  toast.success("Week published.");
                } catch (error) {
                  toast.error(
                    getApiErrorMessage(error, "Unable to publish week."),
                  );
                }
              }}
            >
              <Send className="size-4" />
              Publish week
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
