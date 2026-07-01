import { attendanceQueryKeys } from "../queries/useAttendance";

export const invalidateAttendanceQueries = (queryClient) =>
  queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
