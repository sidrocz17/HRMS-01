import { z } from "zod";

export const holidaySchema = z.object({
  holidayName: z.string().trim().min(1, "Holiday name is required."),
  holidayDate: z.string().trim().min(1, "Holiday date is required."),
  holidayType: z.string().trim().min(1, "Holiday type is required."),
  calendarYear: z.coerce.number().int("Calendar year is required."),
});

/** @typedef {z.infer<typeof holidaySchema>} HolidayInput */
