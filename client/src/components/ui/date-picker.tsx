"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
> & {
  id?: string;
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder?: string;
  dateFormat?: string;
  className?: string;
  triggerDisabled?: boolean;
};

function DatePicker({
  id,
  date,
  onSelect,
  placeholder = "Pick a date",
  dateFormat = "PPP",
  className,
  triggerDisabled = false,
  ...props
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={triggerDisabled}
          data-empty={!date}
          className={cn(
            "relative w-full justify-start pe-10 text-left text-sm font-normal data-[empty=true]:text-muted-foreground bg-transparent",
            className,
          )}
        >
          <span className="block truncate">
            {date ? format(date, dateFormat) : placeholder}
          </span>
          <CalendarIcon className="pointer-events-none absolute inset-e-3 size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          captionLayout="dropdown"
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
