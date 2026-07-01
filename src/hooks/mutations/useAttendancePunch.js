import { useMutation, useQueryClient } from "@tanstack/react-query";
import { punchIn, punchOut } from "../../api/attendanceApi";
import { getApiErrorMessage } from "../../utils/leaveTransformers";
import { invalidateAttendanceQueries } from "./attendanceMutationUtils";

const usePunchMutation = (mutationFn, successMessage, fallbackMessage, options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      await invalidateAttendanceQueries(queryClient);
      options.onSuccess?.(
        {
          data,
          message: data?.message || successMessage,
        },
        variables,
        context
      );
    },
    onError: (error, variables, context) => {
      options.onError?.(
        {
          error,
          message: getApiErrorMessage(error, fallbackMessage),
        },
        variables,
        context
      );
    },
  });
};

export const usePunchIn = (options = {}) =>
  usePunchMutation(
    punchIn,
    "Punched In successfully! Have a great day.",
    "Failed to Punch In. Please try again.",
    options
  );

export const usePunchOut = (options = {}) =>
  usePunchMutation(
    punchOut,
    "Punched Out successfully! See you tomorrow.",
    "Failed to Punch Out. Please try again.",
    options
  );
