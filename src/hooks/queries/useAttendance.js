import { useQuery } from "@tanstack/react-query";
import { getAllAttendance, getAttendance } from "../../api/attendanceApi";

export const attendanceQueryKeys = {
  all: ["attendance"],
  records: () => [...attendanceQueryKeys.all, "records"],
  employeeRecords: () => [...attendanceQueryKeys.records(), "employee"],
  allRecords: (date) => [
    ...attendanceQueryKeys.records(),
    "all",
    { date: String(date || "") },
  ],
};

const ATTENDANCE_STALE_TIME = 60 * 1000;

export const useAttendance = ({
  date,
  isAdminOrHR = false,
  enabled = true,
} = {}) =>
  useQuery({
    queryKey: isAdminOrHR
      ? attendanceQueryKeys.allRecords(date)
      : attendanceQueryKeys.employeeRecords(),
    queryFn: () => (isAdminOrHR ? getAllAttendance(date) : getAttendance()),
    enabled,
    staleTime: ATTENDANCE_STALE_TIME,
  });
