import { z } from "zod";

export const employeeTypeSchema = z.object({
  name: z.string().trim().min(1, "Employee type name is required."),
  isActive: z.boolean().default(true),
});

/** @typedef {z.infer<typeof employeeTypeSchema>} EmployeeTypeInput */
