import { isAfter, isValid, parseISO } from "date-fns";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const shiftHeadcountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => Number(value))
  .pipe(
    z
      .number()
      .int("Headcount must be a whole number.")
      .min(1, "Headcount must be at least 1.")
      .max(12, "Headcount must stay under 13."),
  );

export const shiftFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(80, "Keep the shift title under 80 characters."),
    locationId: z.string().min(1, "Select a location."),
    startsAtLocal: z.string().min(1, "Select a shift start."),
    endsAtLocal: z.string().min(1, "Select a shift end."),
    requiredSkill: z.string().min(1, "Select the required skill."),
    headcount: shiftHeadcountSchema,
  })
  .refine(
    (values) => {
      if (!values.startsAtLocal || !values.endsAtLocal) {
        return true;
      }

      const startsAt = parseISO(values.startsAtLocal);
      const endsAt = parseISO(values.endsAtLocal);

      if (!isValid(startsAt) || !isValid(endsAt)) {
        return false;
      }

      return isAfter(endsAt, startsAt);
    },
    {
      path: ["endsAtLocal"],
      message: "Shift end must be after the shift start.",
    },
  );

export type ShiftFormInputValues = z.input<typeof shiftFormSchema>;
export type ShiftFormValues = z.infer<typeof shiftFormSchema>;
