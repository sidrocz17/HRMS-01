import { z } from "zod";

export const leavePolicySchema = z.object({
  type_id: z.string().trim().min(1, "Leave type is required."),
  employee_type_id: z.string().trim().min(1, "Employee type is required."),
  financial_year: z.string().trim().min(1, "Financial year is required."),
  no_of_days: z.coerce
    .number()
    .positive("Number of days must be greater than zero."),
});

/** @typedef {z.infer<typeof leavePolicySchema>} LeavePolicyInput */
