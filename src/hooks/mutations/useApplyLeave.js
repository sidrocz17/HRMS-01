import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applyLeave } from "../../api/leaveApi";
import { getApiErrorMessage } from "../../utils/leaveTransformers";
import { invalidateLeaveQueries } from "./leaveMutationUtils";

export const useApplyLeave = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyLeave,
    onSuccess: async (data, variables, context) => {
      await invalidateLeaveQueries(queryClient);
      options.onSuccess?.(
        {
          data,
          message: data?.message || "Leave request submitted successfully.",
        },
        variables,
        context
      );
    },
    onError: (error, variables, context) => {
      options.onError?.(
        {
          error,
          message: getApiErrorMessage(error, "Failed to apply leave"),
        },
        variables,
        context
      );
    },
  });
};
