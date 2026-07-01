import { z } from "zod";

export const LEAVE_REASON_MAX_LENGTH = 250;

const requiredTrimmedString = (message) =>
  z.string().trim().min(1, { message });

export const applyLeaveDefaultValues = {
  leaveType: "",
  fromDate: "",
  toDate: "",
  typeOfDay: "full",
  halfSelection: "first",
  reason: "",
};

export const applyLeaveSchema = z
  .object({
    leaveType: requiredTrimmedString("Leave type is required."),
    fromDate: requiredTrimmedString("Start date is required."),
    toDate: requiredTrimmedString("End date is required."),
    typeOfDay: z.enum(["full", "half"]),
    halfSelection: z.enum(["first", "second"]),
    reason: z
      .string()
      .trim()
      .min(10, { message: "Reason must be at least 10 characters." })
      .max(LEAVE_REASON_MAX_LENGTH, {
        message: `Reason cannot exceed ${LEAVE_REASON_MAX_LENGTH} characters.`,
      }),
  })
  .superRefine((values, ctx) => {
    if (!values.fromDate || !values.toDate) return;

    const from = new Date(values.fromDate);
    const to = new Date(values.toDate);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return;

    if (to < from) {
      ctx.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "End date cannot be before start date.",
      });
    }
  });

/**
 * @typedef {z.infer<typeof applyLeaveSchema>} ApplyLeaveFormValues
 */
