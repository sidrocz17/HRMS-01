import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveRejectLeave } from "../../api/leaveApi";
import { getApiErrorMessage } from "../../utils/leaveTransformers";
import { invalidateLeaveQueries } from "./leaveMutationUtils";

export const useApproveLeave = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leaveId, action = "approve", remarks = "" }) =>
      approveRejectLeave(leaveId, action, remarks),
    onSuccess: async (data, variables, context) => {
      await invalidateLeaveQueries(queryClient);
      options.onSuccess?.(
        {
          data,
          message:
            data?.message ||
            `Leave ${variables.action === "reject" ? "rejected" : "approved"} successfully.`,
        },
        variables,
        context
      );
    },
    onError: (error, variables, context) => {
      options.onError?.(
        {
          error,
          message: getApiErrorMessage(error, "Failed to process leave request"),
        },
        variables,
        context
      );
    },
  });
};
