import { z } from "zod";

export const leaveTypeSchema = z.object({
  type: z.string().trim().min(1, "Leave type is required."),
  max_consecutive_days: z.coerce
    .number()
    .int("Max days must be a whole number.")
    .min(0, "Max days cannot be negative."),
  carry_forward_allowed: z.boolean().default(false),
  post_application_allowed: z.boolean().default(false),
});

/** @typedef {z.infer<typeof leaveTypeSchema>} LeaveTypeInput */
