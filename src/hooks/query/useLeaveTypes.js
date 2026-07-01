import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLeaveType,
  deleteLeaveType,
  fetchLeaveTypes,
} from "../../api/leaveTypeApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const leaveTypeQueryKeys = {
  all: ["leaveTypes"],
  lists: () => [...leaveTypeQueryKeys.all, "list"],
  list: () => [...leaveTypeQueryKeys.lists()],
};

export const useLeaveTypes = (options = {}) =>
  useQuery({
    queryKey: leaveTypeQueryKeys.list(),
    queryFn: fetchLeaveTypes,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useLeaveType = useLeaveTypes;

export const useCreateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeaveType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.all }),
  });
};

export const useUpdateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => ({ id, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.all }),
  });
};

export const useDeleteLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.all }),
  });
};
