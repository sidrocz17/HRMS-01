import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLeavePolicy,
  deleteLeavePolicy,
  fetchEmployeeTypes,
  fetchLeavePolicies,
  fetchLeaveTypes,
  updateLeavePolicy,
} from "../../api/leavePolicyApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const leavePolicyQueryKeys = {
  all: ["leavePolicy"],
  lists: () => [...leavePolicyQueryKeys.all, "list"],
  list: () => [...leavePolicyQueryKeys.lists()],
  references: () => [...leavePolicyQueryKeys.all, "references"],
};

export const useLeavePolicy = (options = {}) =>
  useQuery({
    queryKey: leavePolicyQueryKeys.list(),
    queryFn: fetchLeavePolicies,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useLeavePolicyReferences = (options = {}) =>
  useQuery({
    queryKey: leavePolicyQueryKeys.references(),
    queryFn: async () => {
      const [leaveTypes, employeeTypes] = await Promise.all([
        fetchLeaveTypes(),
        fetchEmployeeTypes(),
      ]);
      return { leaveTypes, employeeTypes };
    },
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useCreateLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeavePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leavePolicyQueryKeys.all }),
  });
};

export const useUpdateLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateLeavePolicy(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leavePolicyQueryKeys.all }),
  });
};

export const useDeleteLeavePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeavePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leavePolicyQueryKeys.all }),
  });
};
