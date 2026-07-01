import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployeeType,
  deactivateEmployeeType,
  deleteEmployeeType,
  fetchEmployeeTypes,
  updateEmployeeType,
} from "../../api/employeeTypeApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const employeeTypeQueryKeys = {
  all: ["employeeTypes"],
  lists: () => [...employeeTypeQueryKeys.all, "list"],
  list: () => [...employeeTypeQueryKeys.lists()],
};

export const useEmployeeTypes = (options = {}) =>
  useQuery({
    queryKey: employeeTypeQueryKeys.list(),
    queryFn: fetchEmployeeTypes,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useEmployeeType = useEmployeeTypes;

export const useCreateEmployeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployeeType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeTypeQueryKeys.all }),
  });
};

export const useUpdateEmployeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateEmployeeType(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeTypeQueryKeys.all }),
  });
};

export const useDeactivateEmployeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateEmployeeType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeTypeQueryKeys.all }),
  });
};

export const useDeleteEmployeeType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployeeType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeTypeQueryKeys.all }),
  });
};
