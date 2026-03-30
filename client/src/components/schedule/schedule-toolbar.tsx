import { PencilLine, Send } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

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
import { useScheduleUiStore } from "@/stores/schedule-ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function ScheduleToolbar() {
  const [locationFilter, setLocationFilter, setShiftFilter, shiftFilter] =
    useScheduleUiStore(
      useShallow((state) => [
        state.locationFilter,
        state.setLocationFilter,
        state.setShiftFilter,
        state.shiftFilter,
      ]),
    );
  const weekStartDate = useWorkspaceStore((state) => state.weekStartDate);
  const { data: locationsData } = useLocations();
  const {
    mutateAsync: publishWeek,
    isPending: publishingWeek,
  } = usePublishWeek(weekStartDate);
  const {
    mutateAsync: unpublishWeek,
    isPending: unpublishingWeek,
  } = useUnpublishWeek(weekStartDate);
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
              loading={unpublishingWeek}
              onClick={async () => {
                try {
                  await unpublishWeek();
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
              loading={publishingWeek}
              onClick={async () => {
                try {
                  await publishWeek();
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
