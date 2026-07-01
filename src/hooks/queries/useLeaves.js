import { useQuery } from "@tanstack/react-query";
import { fetchLeaveHistory } from "../../api/leaveApi";
import { normalizeLeaveHistory } from "../../utils/leaveTransformers";
import { leaveQueryKeys } from "./leaveQueryKeys";

const LEAVE_STALE_TIME = 2 * 60 * 1000;

export const useLeaves = (employeeId, options = {}) =>
  useQuery({
    queryKey: leaveQueryKeys.leavesByEmployee(employeeId),
    queryFn: () => fetchLeaveHistory(employeeId),
    enabled: Boolean(employeeId) && options.enabled !== false,
    staleTime: options.staleTime ?? LEAVE_STALE_TIME,
    select: normalizeLeaveHistory,
  });
