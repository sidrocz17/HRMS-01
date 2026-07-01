import { z } from "zod";

export const attendancePolicySchema = z
  .object({
    min_in_time: z.string().trim().min(1, "Minimum In Time is required."),
    min_out_time: z.string().trim().min(1, "Minimum Out Time is required."),
    min_working_hour: z.coerce
      .number()
      .positive("Minimum Working Hours must be greater than zero."),
    half_day_hour: z.coerce
      .number()
      .positive("Half Day Hours must be greater than zero."),
  })
  .refine((data) => data.min_out_time > data.min_in_time, {
    message: "Out Time must be later than In Time.",
    path: ["min_out_time"],
  })
  .refine((data) => data.half_day_hour < data.min_working_hour, {
    message: "Half Day Hours must be less than Working Hours.",
    path: ["half_day_hour"],
  });

/** @typedef {z.infer<typeof attendancePolicySchema>} AttendancePolicyInput */
