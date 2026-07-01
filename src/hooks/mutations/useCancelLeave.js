import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelLeave } from "../../api/leaveApi";
import { getApiErrorMessage } from "../../utils/leaveTransformers";
import { invalidateLeaveQueries } from "./leaveMutationUtils";

export const useCancelLeave = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaveId) => cancelLeave(leaveId),
    onSuccess: async (data, variables, context) => {
      await invalidateLeaveQueries(queryClient);
      options.onSuccess?.(
        {
          data,
          message: data?.message || "Leave request cancelled successfully.",
        },
        variables,
        context
      );
    },
    onError: (error, variables, context) => {
      options.onError?.(
        {
          error,
          message: getApiErrorMessage(error, "Failed to cancel leave"),
        },
        variables,
        context
      );
    },
  });
};
