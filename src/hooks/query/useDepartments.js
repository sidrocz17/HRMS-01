import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  fetchDepartmentById,
  fetchDepartments,
  updateDepartment,
} from "../../api/departmentApi";

const RESOURCE_STALE_TIME = 5 * 60 * 1000;

export const departmentQueryKeys = {
  all: ["departments"],
  lists: () => [...departmentQueryKeys.all, "list"],
  list: () => [...departmentQueryKeys.lists()],
  details: () => [...departmentQueryKeys.all, "detail"],
  detail: (id) => [...departmentQueryKeys.details(), { id: String(id || "") }],
};

export const useDepartments = (options = {}) =>
  useQuery({
    queryKey: departmentQueryKeys.list(),
    queryFn: fetchDepartments,
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useDepartment = useDepartments;

export const useDepartmentDetail = (id, options = {}) =>
  useQuery({
    queryKey: departmentQueryKeys.detail(id),
    queryFn: () => fetchDepartmentById(id),
    enabled: Boolean(id) && options.enabled !== false,
    staleTime: options.staleTime ?? RESOURCE_STALE_TIME,
  });

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all }),
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateDepartment(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.detail(variables?.id) });
    },
  });
};

export const useDeactivateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all }),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentQueryKeys.all }),
  });
};
