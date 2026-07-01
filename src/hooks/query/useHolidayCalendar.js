import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
} from "../../api/holidayApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const holidayCalendarQueryKeys = {
  all: ["holidayCalendar"],
  lists: () => [...holidayCalendarQueryKeys.all, "list"],
  list: (year) => [...holidayCalendarQueryKeys.lists(), { year: Number(year || 0) }],
};

export const useHolidayCalendar = (year, options = {}) =>
  useQuery({
    queryKey: holidayCalendarQueryKeys.list(year),
    queryFn: () => getHolidays(year),
    enabled: Boolean(year) && options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useCreateHolidayCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayCalendarQueryKeys.all }),
  });
};

export const useUpdateHolidayCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateHoliday(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayCalendarQueryKeys.all }),
  });
};

export const useDeleteHolidayCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: holidayCalendarQueryKeys.all }),
  });
};
