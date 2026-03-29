import { MapPinned } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useScheduleWorkspace } from "@/components/schedule/schedule-workspace";

export function ScheduleLocationGrid() {
  const { scheduleBoard } = useScheduleWorkspace();

  if (!scheduleBoard) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Locations</h2>
        <p className="text-sm text-muted-foreground">
          Restaurants on this board.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scheduleBoard.locations.map((location) => (
          <Card key={location.id} className="border-white/70 bg-white/85">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{location.code}</Badge>
                    <Badge variant="secondary">{location.timeZoneLabel}</Badge>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">
                      {location.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {location.city}, {location.region}
                    </p>
                  </div>
                </div>
                <MapPinned className="size-5 text-primary" />
              </div>

              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>{location.addressLine}</p>
                <p>{location.timeZone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
