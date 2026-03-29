import { Badge } from "@/components/ui/badge";

import type { ScheduleDayGroup } from "./schedule.utils";
import { ShiftCard } from "./shift-card";

type ScheduleDaySectionProps = {
  group: ScheduleDayGroup;
};

export function ScheduleDaySection({ group }: ScheduleDaySectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{group.dayLabel}</Badge>
        <h2 className="text-lg font-semibold tracking-tight">{group.dateLabel}</h2>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {group.shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} />
        ))}
      </div>
    </section>
  );
}
