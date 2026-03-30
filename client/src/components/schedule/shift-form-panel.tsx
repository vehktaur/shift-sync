"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { format, isValid, parseISO } from "date-fns";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { usePublishShift, useUnpublishShift } from "@/hooks/use-scheduling";
import { getApiErrorMessage } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWeekEndDate } from "@/components/schedule/schedule.utils";
import type { ShiftFormInputValues, ShiftFormValues } from "@/lib/schemas";
import type {
  ScheduleLocationResponse,
  ShiftResponse,
} from "@/types/scheduling";

type ShiftFormPanelProps = {
  form: UseFormReturn<ShiftFormInputValues, unknown, ShiftFormValues>;
  mode: "create" | "edit";
  shift: ShiftResponse | null;
  locations: ScheduleLocationResponse[];
  skills: string[];
  weekStartDate: string;
  isSaving: boolean;
  onSubmit: (values: ShiftFormValues) => Promise<void>;
};

const getDatePart = (value: string) => value.split("T")[0] ?? "";

const getTimePart = (value: string) => value.split("T")[1]?.slice(0, 5) ?? "";

const parseLocalDate = (value: string) => {
  const parsed = parseISO(value);

  return isValid(parsed) ? parsed : undefined;
};

const buildLocalDateTime = (datePart: string, timePart: string) =>
  datePart && timePart ? `${datePart}T${timePart}` : "";

const buildShiftDateDisabledMatcher = (weekStartDate: string) => {
  const weekEndDate = getWeekEndDate(weekStartDate);

  return (date: Date) => {
    const day = format(date, "yyyy-MM-dd");
    return day < weekStartDate || day > weekEndDate;
  };
};

type LocalDateTimeFieldProps = {
  id: string;
  label: string;
  value: string;
  invalid: boolean;
  disabled: boolean;
  weekStartDate: string;
  onChange: (value: string) => void;
  error?: { message?: string };
};

function LocalDateTimeField({
  id,
  label,
  value,
  invalid,
  disabled,
  weekStartDate,
  onChange,
  error,
}: LocalDateTimeFieldProps) {
  const dateValue = parseLocalDate(value);
  const timeValue = getTimePart(value);
  const disableDate = buildShiftDateDisabledMatcher(weekStartDate);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
        <DatePicker
          id={id}
          date={dateValue}
          triggerDisabled={disabled}
          placeholder="Pick a date"
          dateFormat="EEE, MMM d, yyyy"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(2100, 11)}
          disabled={disableDate}
          onSelect={(date) => {
            const datePart = date ? format(date, "yyyy-MM-dd") : "";
            onChange(buildLocalDateTime(datePart, timeValue || "00:00"));
          }}
        />
        <Input
          type="time"
          step={60}
          value={timeValue}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(event) => {
            onChange(
              buildLocalDateTime(getDatePart(value), event.target.value),
            );
          }}
        />
      </div>
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

export function ShiftFormPanel({
  form,
  mode,
  shift,
  locations,
  skills,
  weekStartDate,
  isSaving,
  onSubmit,
}: ShiftFormPanelProps) {
  const publishShiftMutation = usePublishShift();
  const unpublishShiftMutation = useUnpublishShift();
  const isPublishing =
    publishShiftMutation.isPending || unpublishShiftMutation.isPending;

  return (
    <div className="space-y-6 p-6" data-tour="shift-form-panel">
      <DialogHeader className="space-y-2">
        <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
          {mode === "create" ? "Create shift" : "Edit shift"}
        </Badge>
        <DialogTitle className="text-xl">
          {mode === "create"
            ? "Shift details"
            : (shift?.title ?? "Shift details")}
        </DialogTitle>
        <DialogDescription>
          Location, local time, skill, and headcount.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="grid gap-5 md:grid-cols-2">
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                className="md:col-span-2"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  {...field}
                  id="title"
                  placeholder="Friday closing bar"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="locationId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="locationId">Location</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="locationId"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Choose a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.timeZoneLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="requiredSkill"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="requiredSkill">Skill</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="requiredSkill"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Choose a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="startsAtLocal"
            control={form.control}
            render={({ field, fieldState }) => (
              <LocalDateTimeField
                id="startsAtLocal"
                label="Starts"
                value={field.value}
                invalid={fieldState.invalid}
                disabled={isSaving}
                weekStartDate={weekStartDate}
                onChange={field.onChange}
                error={fieldState.error}
              />
            )}
          />

          <Controller
            name="endsAtLocal"
            control={form.control}
            render={({ field, fieldState }) => (
              <LocalDateTimeField
                id="endsAtLocal"
                label="Ends"
                value={field.value}
                invalid={fieldState.invalid}
                disabled={isSaving}
                weekStartDate={weekStartDate}
                onChange={field.onChange}
                error={fieldState.error}
              />
            )}
          />

          <Controller
            name="headcount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="headcount">Headcount</FieldLabel>
                <Input
                  {...field}
                  id="headcount"
                  type="number"
                  min={1}
                  max={12}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        <FieldError
          errors={
            form.formState.errors.root
              ? [form.formState.errors.root]
              : undefined
          }
        />

        <DialogFooter showCloseButton>
          {shift && (
            <Button
              type="button"
              variant={shift.published ? "outline" : "secondary"}
              loading={isPublishing}
              data-tour="shift-publish-button"
              onClick={async () => {
                try {
                  if (shift.published) {
                    await unpublishShiftMutation.mutateAsync(shift.id);
                    toast.success(`${shift.title} moved to draft.`);
                    return;
                  }

                  await publishShiftMutation.mutateAsync(shift.id);
                  toast.success(`${shift.title} published.`);
                } catch (error) {
                  toast.error(
                    getApiErrorMessage(
                      error,
                      shift.published
                        ? "Unable to unpublish shift."
                        : "Unable to publish shift.",
                    ),
                  );
                }
              }}
              disabled={!shift.canEdit || isSaving}
            >
              <Send className="size-4" />
              {shift.published ? "Unpublish shift" : "Publish shift"}
            </Button>
          )}
          <Button type="submit" loading={isSaving}>
            {mode === "create" ? "Create shift" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
