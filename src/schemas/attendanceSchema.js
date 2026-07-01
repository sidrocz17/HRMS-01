import { z } from "zod";

const requiredTrimmedString = (message) =>
  z.string().trim().min(1, { message });

export const attendancePunchSchema = z.object({
  employeeId: requiredTrimmedString("Employee ID is required."),
  date: requiredTrimmedString("Attendance date is required.").regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Attendance date must be in YYYY-MM-DD format."
  ),
  punchType: z.enum(["IN", "OUT"]),
  remarks: z.string().trim().optional().or(z.literal("")),
});

/**
 * @typedef {z.infer<typeof attendancePunchSchema>} AttendancePunchValues
 */
