import { useQuery } from "@tanstack/react-query";
import { fetchLeaveDetails } from "../../api/leaveApi";
import { leaveQueryKeys } from "./leaveQueryKeys";

export const useLeaveDetails = (leaveId, options = {}) =>
  useQuery({
    queryKey: [...leaveQueryKeys.all, "details", { leaveId: String(leaveId || "") }],
    queryFn: () => fetchLeaveDetails(leaveId),
    enabled: Boolean(leaveId) && options.enabled !== false,
    staleTime: options.staleTime ?? 60 * 1000,
  });
