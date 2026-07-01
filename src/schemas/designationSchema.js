import { z } from "zod";

export const designationSchema = z.object({
  title: z.string().trim().min(1, "Designation title is required."),
  description: z.string().optional().default(""),
  is_active: z.boolean().default(true),
});

/** @typedef {z.infer<typeof designationSchema>} DesignationInput */
