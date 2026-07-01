import { leaveQueryKeys } from "../queries/leaveQueryKeys";

// Mutations change server state. After success, invalidate the affected query
// families so TanStack Query refetches fresh leave lists/balances where needed.
export const invalidateLeaveQueries = async (queryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: leaveQueryKeys.leaves() }),
    queryClient.invalidateQueries({ queryKey: leaveQueryKeys.teamLeaves() }),
    queryClient.invalidateQueries({ queryKey: leaveQueryKeys.balance() }),
    queryClient.invalidateQueries({ queryKey: leaveQueryKeys.summary() }),
  ]);
};
