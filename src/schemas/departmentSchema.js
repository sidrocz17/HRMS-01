import { z } from "zod";

export const departmentSchema = z.object({
  dept_name: z.string().trim().min(1, "Department name is required."),
  description: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

/** @typedef {z.infer<typeof departmentSchema>} DepartmentInput */
