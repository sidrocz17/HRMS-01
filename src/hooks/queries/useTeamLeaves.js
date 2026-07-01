import { useQuery } from "@tanstack/react-query";
import { fetchTeamLeaves } from "../../api/leaveApi";
import { normalizeTeamLeaves } from "../../utils/leaveTransformers";
import { leaveQueryKeys } from "./leaveQueryKeys";

const TEAM_LEAVE_STALE_TIME = 60 * 1000;

export const useTeamLeaves = (currentEmployeeId, options = {}) =>
  useQuery({
    // currentEmployeeId affects the derived is_own_leave flag, so it is part
    // of the key even though the backend endpoint itself is shared.
    queryKey: leaveQueryKeys.teamLeavesView(currentEmployeeId),
    queryFn: fetchTeamLeaves,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? TEAM_LEAVE_STALE_TIME,
    select: (response) => normalizeTeamLeaves(response, currentEmployeeId),
  });
